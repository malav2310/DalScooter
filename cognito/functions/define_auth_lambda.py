def lambda_handler(event, context):
    if len(event['request']['session']) == 0:
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
        event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
    elif len(event['request']['session']) < 3 and event['request']['session'][-1]['challengeResult']:
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = False
        event['response']['challengeName'] = 'CUSTOM_CHALLENGE'
    elif len(event['request']['session']) == 3 and event['request']['session'][-1]['challengeResult']:
        event['response']['issueTokens'] = True
        event['response']['failAuthentication'] = False
    else:
        event['response']['issueTokens'] = False
        event['response']['failAuthentication'] = True
    return event