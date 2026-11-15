package main

// Pictures and Fliers pack. A picture asked for at /pack/<path> comes from an installed pack folder when there is one;
// otherwise it is fetched once from the public pack on the IBIN Apps releases page (one HTTP Range request into an
// uncompressed zip, located with the pack's index.json) and kept in %LOCALAPPDATA%\IBINApps\packs\<pack> for next time.

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type packIndex struct {
	Parts []string            `json:"parts"`
	F     map[string][3]int64 `json:"f"`
}

var (
	pkMu    sync.Mutex
	pkIdx   *packIndex
	pkTried time.Time
	pkHTTP  = &http.Client{Timeout: 90 * time.Second}
)

func packIndexGet(cache, base string) *packIndex {
	pkMu.Lock()
	defer pkMu.Unlock()
	if pkIdx != nil {
		return pkIdx
	}
	f := filepath.Join(cache, "index.json")
	if b, err := os.ReadFile(f); err == nil {
		var ix packIndex
		if json.Unmarshal(b, &ix) == nil && len(ix.F) > 0 {
			pkIdx = &ix
			return pkIdx
		}
	}
	if time.Since(pkTried) < 20*time.Second { // offline: do not ask again for every picture
		return nil
	}
	pkTried = time.Now()
	r, err := pkHTTP.Get(base + "index.json")
	if err != nil {
		return nil
	}
	defer r.Body.Close()
	b, err := io.ReadAll(r.Body)
	if err != nil || r.StatusCode != 200 {
		return nil
	}
	var ix packIndex
	if json.Unmarshal(b, &ix) != nil || len(ix.F) == 0 {
		return nil
	}
	os.MkdirAll(cache, 0o755)
	os.WriteFile(f, b, 0o644)
	pkIdx = &ix
	return pkIdx
}

func packHandler(local []string, cache, base string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rel, err := url.PathUnescape(strings.TrimPrefix(r.URL.EscapedPath(), "/pack/"))
		rel = path.Clean("/" + rel)[1:]
		if err != nil || rel == "" || strings.Contains(rel, "..") {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "max-age=86400")
		for _, d := range local {
			p := filepath.Join(d, filepath.FromSlash(rel))
			if st, err := os.Stat(p); err == nil && !st.IsDir() {
				http.ServeFile(w, r, p)
				return
			}
		}
		p := filepath.Join(cache, filepath.FromSlash(rel))
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			http.ServeFile(w, r, p)
			return
		}
		ix := packIndexGet(cache, base)
		if ix == nil {
			http.Error(w, "pictures pack not reachable", 503)
			return
		}
		e, ok := ix.F[rel]
		if !ok || int(e[0]) >= len(ix.Parts) {
			http.NotFound(w, r)
			return
		}
		req, _ := http.NewRequest("GET", base+ix.Parts[e[0]], nil)
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", e[1], e[1]+e[2]-1))
		resp, err := pkHTTP.Do(req)
		if err != nil {
			http.Error(w, "pictures pack not reachable", 503)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode != 206 {
			http.Error(w, "pictures pack not reachable", 502)
			return
		}
		b, err := io.ReadAll(io.LimitReader(resp.Body, e[2]+1))
		if err != nil || int64(len(b)) != e[2] {
			http.Error(w, "pictures pack not reachable", 502)
			return
		}
		os.MkdirAll(filepath.Dir(p), 0o755)
		tmp := p + ".part"
		if os.WriteFile(tmp, b, 0o644) == nil {
			os.Rename(tmp, p)
		}
		http.ServeFile(w, r, p)
	}
}
