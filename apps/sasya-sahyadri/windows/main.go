// Sasya Sahyadri — Windows launcher (Version 1, original).
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
	"sync/atomic"
	"syscall"
	"time"
)

//go:embed web
var webFiles embed.FS

const port = "47823" // fixed so a second launch reuses the running copy

var lastPing atomic.Int64

const keepAlive = `<script>setInterval(function(){fetch('/__alive').catch(function(){})},3000);fetch('/__alive').catch(function(){});</script>`

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
		lastPing.Store(time.Now().Unix())
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
	lastPing.Store(time.Now().Unix() + 60) // allow up to ~80 s for the window to open
	openWindow(url)

	for { // stop when no open window has checked in for 20 seconds
		time.Sleep(5 * time.Second)
		if time.Now().Unix()-lastPing.Load() > 20 {
			os.Exit(0)
		}
	}
}

// openWindow uses Edge in app mode (a plain window without browser toolbars);
// if Edge is missing it falls back to the default browser.
func openWindow(url string) {
	profile := filepath.Join(os.Getenv("LOCALAPPDATA"), "SasyaSahyadri", "window")
	args := []string{"--app=" + url, "--user-data-dir=" + profile, "--window-size=1360,900", "--no-first-run", "--no-default-browser-check"}
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
