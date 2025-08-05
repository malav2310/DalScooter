import json
import boto3
import uuid
import os
from datetime import datetime
from decimal import Decimal

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
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def add_bike(event):
    body = json.loads(event['body'])
    
    bike_id = str(uuid.uuid4())
    access_code = f"ACCESS-{str(uuid.uuid4())[:8].upper()}"
    
    bike_item = {
        'bike_id': bike_id,
        'bike_type': body['bike_type'],
        'hourly_rate': Decimal(str(body['hourly_rate'])),
        'franchise_id': body['franchise_id'],
        'location': body.get('location', ''),
        'features': body.get('features', []),
        'access_code': access_code,
        'available': body.get('available', True),
        'battery_life': body.get('battery_life', 'Standard'),
        'height_adjustment': body.get('height_adjustment', False),
        'created_date': datetime.now().isoformat()
    }
    
    bikes_table.put_item(Item=bike_item)
    
    return {
        'statusCode': 201,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'bike_id': bike_id,
            'message': 'Bike added successfully',
            'access_code': access_code
        })
    }

def update_bike(event):
    body = json.loads(event['body'])
    bike_id = body.get('bike_id')

    if not bike_id:
        return {'statusCode': 400, 'body': json.dumps({'error': 'bike_id is required'})}

    # 1. CRITICAL FIX: Check if the bike exists first
    try:
        response = bikes_table.get_item(Key={'bike_id': bike_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Bike with ID {bike_id} not found'})
            }
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

    # 2. CRITICAL FIX: Safely build the update expression
    update_expression_parts = []
    expression_values = {}
    expression_names = {}

    # Define which fields are updatable
    updatable_fields = {
        "hourly_rate": "Decimal",
        "available": "Boolean",
        "location": "String", # 'location' is a reserved word
        "features": "List",
        "battery_life": "String",
        "height_adjustment": "Boolean"
    }
    
    for field, field_type in updatable_fields.items():
        if field in body:
            # Use placeholders for names and values to avoid injection issues
            # and handle reserved keywords
            name_placeholder = f"#{field}"
            value_placeholder = f":{field}"

            update_expression_parts.append(f"{name_placeholder} = {value_placeholder}")
            expression_names[name_placeholder] = field

            # Set value with correct type
            if field_type == "Decimal":
                expression_values[value_placeholder] = Decimal(str(body[field]))
            else:
                expression_values[value_placeholder] = body[field]

    if not update_expression_parts:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No valid fields provided for update'})
        }

    update_expression = "SET " + ", ".join(update_expression_parts)
    
    # 3. Perform the update
    bikes_table.update_item(
        Key={'bike_id': bike_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values,
        ExpressionAttributeNames=expression_names
    )
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': f'Bike {bike_id} updated successfully'})
    }
