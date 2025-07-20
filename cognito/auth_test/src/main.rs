use crate::get_session::{sign_in, sign_up};
use aws_config::Region;
use colored::Colorize;
use inquire::Select;

mod get_session;

pub type CognitoClient = aws_sdk_cognitoidentityprovider::Client;

#[derive(Clone)]
enum MenuItems {
    SignIn,
    SignUp,
}

impl std::fmt::Display for MenuItems {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::SignIn => "Sign In",
            Self::SignUp => "Sign Up",
        };
        write!(f, "{s}")
    }
}

#[tokio::main]
async fn main() {
    let region = Region::new("us-east-1");
    let client_id = "4p13tg1ogbcvvgthqqmvhc5ibc";

    let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(region.clone())
        .load()
        .await;
    let cognito = aws_sdk_cognitoidentityprovider::Client::new(&config);

    loop {
        let Ok(choice) = Select::new(
            &format!("{}", "Welcome to the Database!".green()),
            vec![MenuItems::SignIn, MenuItems::SignUp],
        )
        .prompt() else {
            return;
        };

        let auth_result = match choice {
            MenuItems::SignIn => sign_in(&cognito, &client_id).await,
            MenuItems::SignUp => {
                if let Err(e) = sign_up(&cognito, &client_id).await {
                    eprintln!("{}", e.red());
                    return;
                }

                println!("{}", "You have successfully signed up!".green());
                return;
            }
        };

        let auth_result = match auth_result {
            Ok(t) => t,
            Err(s) if s == "Incorrect username or password." => {
                eprintln!(
                    "{}",
                    "Incorrect username, password, or challenge answer.".red()
                );
                return;
            }
            Err(s) => {
                eprintln!("{}", s.red());
                return;
            }
        }
        .authentication_result
        .unwrap();

        let access_token = auth_result.access_token().unwrap();
        let token_id = auth_result.id_token().unwrap();
        // println!("{:#?}", (access_token, token_id));
        println!("Access Token: {access_token:#?}");
        println!("Token ID: {token_id:#?}");

        println!("{}", "Successfully signed in!".green());

        cognito
            .global_sign_out()
            .access_token(auth_result.access_token().unwrap())
            .send()
            .await
            .unwrap();
        
        return;
    }
}

#[test]
fn mod_test() {
    let x: i32 = -2;
    println!("{}", x.rem_euclid(26));
}
