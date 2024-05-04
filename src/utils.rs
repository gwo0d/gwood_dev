use std::fs::read_to_string;
use std::io::Result;

pub(crate) fn read_string_from_file(path: &str) -> Result<String> {
    read_to_string(path)
}