// Phyllanthus & Rattans Identification Kit — Windows launcher (Version 1.0.0, Original).
// Carries the whole kit inside the exe, serves it only to this computer (127.0.0.1),
// and opens it in its own Microsoft Edge app window. Closes itself when the window is closed.
package main

import (
	"bytes"
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
)

//go:embed web
var webFiles embed.FS

const port = "47811" // fixed so a second launch reuses the running copy

// Every open window checks in every 3 seconds with its own id. A minimised or hidden window says so, because
// Edge then slows its timers to about once a minute (or stops them): a hidden window is kept until it closes
// instead of being timed out. A closing window says goodbye.
type winState struct {
	last   time.Time
	hidden bool
}

var (
	mu      sync.Mutex
	windows = map[string]*winState{}
)

const keepAlive = `<script>(function(){var id=Math.random().toString(36).slice(2);function p(){fetch('/__alive?id='+id+'&h='+(document.hidden?1:0),{cache:'no-store'}).catch(function(){})}setInterval(p,3000);p();document.addEventListener('visibilitychange',p);addEventListener('pageshow',p);addEventListener('pagehide',function(){navigator.sendBeacon('/__alive?bye=1&id='+id)});})();</script>`

func main() {
	addr := "127.0.0.1:" + port
	url := "http://" + addr + "/"

	ln, err := net.Listen("tcp", addr)
	if err != nil { // already running: just open another window
		openWindow(url)
		return
	}

	root, _ := fs.Sub(webFiles, "web")
	files := http.FileServer(http.FS(root))
	index, _ := fs.ReadFile(root, "index.html")
	index = bytes.Replace(index, []byte("</body>"), []byte(keepAlive+"</body>"), 1)
	if !bytes.Contains(index, []byte("__alive")) {
		index = append(index, []byte(keepAlive)...)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/__alive", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if id := q.Get("id"); id != "" {
			mu.Lock()
			if q.Get("bye") != "" {
				delete(windows, id)
			} else {
				windows[id] = &winState{last: time.Now(), hidden: q.Get("h") == "1"}
			}
			mu.Unlock()
		}
		w.WriteHeader(204)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || strings.EqualFold(r.URL.Path, "/index.html") {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.Write(index)
			return
		}
		files.ServeHTTP(w, r)
	})

	go http.Serve(ln, mux)
	start := time.Now()
	openWindow(url)

	emptySince := start
	for {
		time.Sleep(5 * time.Second)
		now := time.Now()
		mu.Lock()
		for id, s := range windows {
			limit := 20 * time.Second // a visible window that stopped checking in was closed or crashed
			if s.hidden {
				limit = 12 * time.Hour
			}
			if now.Sub(s.last) > limit {
				delete(windows, id)
			}
		}
		open := len(windows)
		mu.Unlock()
		if open > 0 {
			emptySince = now
			continue
		}
		// no window: allow ~80 s for the first one to open, and 15 s after the last one closed (a reload says goodbye and checks in again)
		if now.Sub(start) > 80*time.Second && now.Sub(emptySince) > 15*time.Second {
			os.Exit(0)
		}
	}
}

// openWindow uses Edge in app mode (a plain window without browser toolbars);
// if Edge is missing it falls back to the default browser.
func openWindow(url string) {
	profile := filepath.Join(os.Getenv("LOCALAPPDATA"), "PhyllanthusRattansKit", "window")
	args := []string{"--app=" + url, "--user-data-dir=" + profile, "--window-size=1280,860", "--no-first-run", "--no-default-browser-check"}
	for _, edge := range []string{
		filepath.Join(os.Getenv("ProgramFiles(x86)"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(os.Getenv("ProgramFiles"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(os.Getenv("LOCALAPPDATA"), `Microsoft\Edge\Application\msedge.exe`),
	} {
		if _, err := os.Stat(edge); err == nil {
			if exec.Command(edge, args...).Start() == nil {
				return
			}
		}
	}
	c := exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	c.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	c.Start()
}
