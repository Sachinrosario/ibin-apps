// Desktop window for the Birds Group Identification.
// The app itself is the web version in ../web; this only opens it in a native window.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("could not start the Birds Group Identification");
}
