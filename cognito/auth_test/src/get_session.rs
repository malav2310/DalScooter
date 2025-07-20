use aws_sdk_cognitoidentityprovider::{
    Client, operation::respond_to_auth_challenge::RespondToAuthChallengeOutput, types::AuthFlowType,
};
use inquire::{Password, Text};

pub async fn sign_up(cognito: &Client, client_id: &str) -> Result<(), String> {
    let usrname = Text::new("Username:").prompt().unwrap();
    let pass = Password::new("Password:").prompt().unwrap();

    let question = Text::new("Enter a challenge question:").prompt().unwrap();
    let answer = Text::new("Enter the answer to the above question:")
        .prompt()
        .unwrap();
    let caesar_key = Text::new("Enter a caesar-cipher key:").prompt().unwrap();

    let t = cognito
        .sign_up()
        .client_id(client_id)
        .username(&usrname)
        .password(&pass)
        .client_metadata("challenge_question", question)
        .client_metadata("challenge_answer", answer)
        .client_metadata("caesar_key", caesar_key)
        .send()
        .await
        .map_err(|e| {
            let se = e.as_service_error().unwrap();
            se.meta().message().unwrap().to_string()
        });

    if let Err(e) = t {
        return Err(e);
    }

    Ok(())
}

pub async fn sign_in(
    cognito: &Client,
    client_id: &str,
) -> Result<RespondToAuthChallengeOutput, String> {
    let usrname = Text::new("Username:").prompt().unwrap();
    let pass = Password::new("Password:")
        .without_confirmation()
        .prompt()
        .unwrap();

    let t = cognito
        .initiate_auth()
        .client_id(client_id)
        .auth_flow(AuthFlowType::CustomAuth)
        .auth_parameters("USERNAME", &usrname)
        .auth_parameters("PASSWORD", &pass)
        .send()
        .await
        .map_err(|e| {
            let se = e.as_service_error().unwrap();
            se.meta().message().unwrap().to_string()
        });

    let t = match t {
        Ok(_t) => _t,
        Err(e) => return Err(e),
    };

    let challenge_name = t.challenge_name.unwrap();
    let session = t.session.unwrap();

    let t = cognito
        .respond_to_auth_challenge()
        .client_id(client_id)
        .challenge_name(challenge_name)
        .challenge_responses("USERNAME", &usrname)
        .challenge_responses("ANSWER", pass)
        .client_metadata("CLIENT_ID", client_id)
        .session(session)
        .send()
        .await
        .map_err(|e| {
            let se = e.as_service_error().unwrap();
            se.meta().message().unwrap().to_string()
        });

    let t = match t {
        Ok(_t) => _t,
        Err(e) => return Err(e),
    };

    let challenge_name = t.challenge_name.unwrap();
    let challenge_params = t.challenge_parameters.unwrap();
    let session = t.session.unwrap();

    let challenge_answer = Text::new(&format!("{}?", challenge_params["question"]))
        .prompt()
        .unwrap();

    let t = cognito
        .respond_to_auth_challenge()
        .client_id(client_id)
        .session(session)
        .challenge_name(challenge_name)
        .challenge_responses("USERNAME", &usrname)
        .challenge_responses("ANSWER", challenge_answer)
        .send()
        .await
        .map_err(|e| {
            let se = e.as_service_error().unwrap();
            se.meta().message().unwrap().to_string()
        });

    let t = match t {
        Ok(_t) => _t,
        Err(e) => return Err(e),
    };

    let challenge_name = t.challenge_name.unwrap();
    let challenge_params = t.challenge_parameters.unwrap();
    let session = t.session.unwrap();

    println!(
        "{} {}",
        challenge_params["prompt"], challenge_params["question"]
    );
    let cipher_answer = inquire::Text::new("").prompt().unwrap();

    let t = cognito
        .respond_to_auth_challenge()
        .client_id(client_id)
        .session(session)
        .challenge_name(challenge_name)
        .challenge_responses("USERNAME", usrname)
        .challenge_responses("ANSWER", cipher_answer)
        .send()
        .await
        .map_err(|e| {
            let se = e.as_service_error().unwrap();
            se.meta().message().unwrap().to_string()
        });

    let t = match t {
        Ok(_t) => _t,
        Err(e) => return Err(e),
    };

    Ok(t)
}
