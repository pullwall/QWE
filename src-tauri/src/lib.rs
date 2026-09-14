use rdev::{Event, EventType, Key};
use serde::Serialize;
use std::{collections::HashSet, sync::Mutex, thread};
use tauri::{AppHandle, Emitter, LogicalSize, Manager, WebviewWindow};

#[derive(Clone, Serialize)]
struct KeyPayload {
    key: &'static str,
    state: &'static str,
}

fn watched_key(key: Key) -> Option<&'static str> {
    match key {
        Key::KeyQ => Some("Q"),
        Key::KeyW => Some("W"),
        Key::KeyE => Some("E"),
        _ => None,
    }
}

fn emit_key_event(app: &AppHandle, event: Event, pressed: &Mutex<HashSet<&'static str>>) {
    let (key, state) = match event.event_type {
        EventType::KeyPress(raw) => (watched_key(raw), "down"),
        EventType::KeyRelease(raw) => (watched_key(raw), "up"),
        _ => return,
    };
    let Some(key) = key else { return };

    let mut down = pressed.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    let should_emit = if state == "down" {
        down.insert(key)
    } else {
        down.remove(key)
    };

    if should_emit {
        let _ = app.emit("qwe-key-event", KeyPayload { key, state });
    }
}

#[tauri::command]
fn set_view_mode(window: WebviewWindow, expanded: bool) -> Result<(), String> {
    let size = if expanded {
        LogicalSize::new(668.0, 698.0)
    } else {
        LogicalSize::new(480.0, 260.0)
    };
    window.set_size(size).map_err(|error| error.to_string())
}

#[tauri::command]
fn set_always_on_top(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    window.set_always_on_top(enabled).map_err(|error| error.to_string())
}

#[tauri::command]
fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|error| error.to_string())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            thread::spawn(move || {
                let pressed = Mutex::new(HashSet::new());
                if let Err(error) = rdev::listen(move |event| emit_key_event(&handle, event, &pressed)) {
                    eprintln!("global input listener stopped: {error:?}");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_view_mode, set_always_on_top, start_dragging, quit_app])
        .run(tauri::generate_context!())
        .expect("error while running QWE Healing Clicker");
}
