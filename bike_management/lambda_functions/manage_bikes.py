import json
import boto3
import uuid
import os

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table(os.environ['BIKES_TABLE'])

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        
        if http_method == 'POST':
            return add_bike(event)
        elif http_method == 'PUT':
            return update_bike(event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def add_bike(event):
    body = json.loads(event['body'])
    
    bike_id = str(uuid.uuid4())
    access_code = f"AC{uuid.uuid4().hex[:6].upper()}"
    
    bike_item = {
        'bike_id': bike_id,
        'bike_type': body['bike_type'],  # gyroscooter, ebikes, segway
        'hourly_rate': float(body['hourly_rate']),
        'access_code': access_code,
        'available': body.get('available', True),
        'location': body.get('location', ''),
        'features': body.get('features', []),
        'franchise_id': body['franchise_id'],
        'battery_life': body.get('battery_life', 'Standard'),
        'height_adjustment': body.get('height_adjustment', False),
        'discount_code': body.get('discount_code', ''),
        'created_date': body.get('created_date', ''),
        'last_updated': body.get('last_updated', '')
    }
    
    bikes_table.put_item(Item=bike_item)
    
    return {
        'statusCode': 201,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'bike_id': bike_id,
            'access_code': access_code,
            'message': 'Bike added successfully'
        })
    }

def update_bike(event):
    body = json.loads(event['body'])
    bike_id = body['bike_id']
    
    # Get existing bike
    response = bikes_table.get_item(Key={'bike_id': bike_id})
    
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bike not found'})
        }
    
    # Update attributes
    update_expression = "SET "
    expression_values = {}
    
    updatable_fields = [
        'hourly_rate', 'available', 'location', 'features',
        'battery_life', 'height_adjustment', 'discount_code', 'last_updated'
    ]
    
    updates = []
    for field in updatable_fields:
        if field in body:
            updates.append(f"{field} = :{field}")
            expression_values[f":{field}"] = body[field]
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No valid fields to update'})
        }
    
    update_expression += ", ".join(updates)
    
    bikes_table.update_item(
        Key={'bike_id': bike_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Bike updated successfully'})
    }
