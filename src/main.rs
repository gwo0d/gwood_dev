mod utils;

use crate::utils::{read_string_from_file};

#[macro_use] extern crate rocket;
use rocket_dyn_templates::{context, Template};
use rocket::fs::FileServer;

#[get("/")]
#[allow(non_snake_case)]
fn index() -> Template {
    Template::render("index", context! {
        page_title: "Home",
        content: read_string_from_file("content/index.html").expect("Internal Server Error"),
        menu_items: context! {
            Home: "/"
        }
    })
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .mount("/static", FileServer::from("static"))
        .attach(Template::fairing())
}