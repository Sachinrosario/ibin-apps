// Desktop window for the Eastern Ghats Mapping.
// The app itself is the web version in ../web; this opens it in a native window and serves the Pictures and Fliers
// pack at ibinpack://: each picture is fetched once from the public pack on the IBIN Apps releases page (one HTTP Range
// request into an uncompressed zip, located with the pack's index.json) and kept in the app's cache folder.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, io::Read, path::{Path, PathBuf}, sync::Mutex, time::{Duration, Instant}};
use tauri::{http::Response, Manager};

const BASE: &str = "https://github.com/Sachinrosario/ibin-apps/releases/download/eastern-ghats-mapping-pictures-1.0.0/";
static INDEX: Mutex<Option<serde_json::Value>> = Mutex::new(None);
static TRIED: Mutex<Option<Instant>> = Mutex::new(None);

fn agent() -> ureq::Agent { ureq::AgentBuilder::new().timeout(Duration::from_secs(90)).build() }

fn index(cache: &Path) -> Option<serde_json::Value> {
    let mut g = INDEX.lock().ok()?;
    if let Some(v) = g.as_ref() { return Some(v.clone()); }
    let f = cache.join("index.json");
    if let Ok(b) = fs::read(&f) { if let Ok(v) = serde_json::from_slice::<serde_json::Value>(&b) { *g = Some(v.clone()); return Some(v); } }
    { let mut t = TRIED.lock().ok()?; if let Some(t0) = *t { if t0.elapsed() < Duration::from_secs(20) { return None; } } *t = Some(Instant::now()); }
    let mut b = Vec::new();
    agent().get(&format!("{BASE}index.json")).call().ok()?.into_reader().read_to_end(&mut b).ok()?;
    let v: serde_json::Value = serde_json::from_slice(&b).ok()?;
    let _ = fs::create_dir_all(cache); let _ = fs::write(&f, &b);
    *g = Some(v.clone()); Some(v)
}

fn mime(p: &str) -> &'static str {
    let l = p.to_ascii_lowercase();
    if l.ends_with(".png") { "image/png" } else if l.ends_with(".gif") { "image/gif" } else if l.ends_with(".bmp") { "image/bmp" } else { "image/jpeg" }
}

fn reply(status: u16, mime_type: &str, body: Vec<u8>) -> Response<Vec<u8>> {
    Response::builder().status(status).header("Content-Type", mime_type).header("Access-Control-Allow-Origin", "*").body(body).unwrap()
}

fn serve(cache: PathBuf, raw: String) -> Response<Vec<u8>> {
    let rel = percent_encoding::percent_decode_str(raw.trim_start_matches('/')).decode_utf8_lossy().to_string();
    if rel.is_empty() || rel.contains("..") { return reply(404, "text/plain", b"not found".to_vec()); }
    let file = cache.join(&rel);
    if let Ok(b) = fs::read(&file) { return reply(200, mime(&rel), b); }
    let Some(ix) = index(&cache) else { return reply(503, "text/plain", b"pictures pack not reachable".to_vec()) };
    let Some(e) = ix["f"][&rel].as_array() else { return reply(404, "text/plain", b"not found".to_vec()) };
    let (part, off, len) = (e[0].as_u64().unwrap_or(0) as usize, e[1].as_u64().unwrap_or(0), e[2].as_u64().unwrap_or(0));
    let Some(name) = ix["parts"][part].as_str() else { return reply(404, "text/plain", b"not found".to_vec()) };
    let resp = match agent().get(&format!("{BASE}{name}")).set("Range", &format!("bytes={}-{}", off, off + len - 1)).call() {
        Ok(r) if r.status() == 206 => r,
        _ => return reply(503, "text/plain", b"pictures pack not reachable".to_vec()),
    };
    let mut b = Vec::with_capacity(len as usize);
    if resp.into_reader().take(len + 1).read_to_end(&mut b).is_err() || b.len() as u64 != len { return reply(502, "text/plain", b"incomplete".to_vec()); }
    if let Some(d) = file.parent() { let _ = fs::create_dir_all(d); }
    let tmp = file.with_extension("part");
    if fs::write(&tmp, &b).is_ok() { let _ = fs::rename(&tmp, &file); }
    reply(200, mime(&rel), b)
}

fn main() {
    tauri::Builder::default()
        .register_asynchronous_uri_scheme_protocol("ibinpack", |ctx, req, responder| {
            let cache = ctx.app_handle().path().app_cache_dir().unwrap_or_else(|_| std::env::temp_dir()).join("pack");
            let path = req.uri().path().to_string();
            std::thread::spawn(move || responder.respond(serve(cache, path)));
        })
        .run(tauri::generate_context!())
        .expect("could not start the Eastern Ghats Mapping");
}
