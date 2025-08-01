#!/usr/bin/env python3
"""
Script to initialize the knowledge base and sample booking data
Run this after deploying the Terraform infrastructure
"""

import boto3
import json
from datetime import datetime, timedelta

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

def init_knowledge_base():
    """Initialize the bot knowledge base with FAQ data"""
    
    table_name = 'dalscooter-dev-bot-knowledge'  # Update based on your naming
    table = dynamodb.Table(table_name)
    
    knowledge_items = [
        {
            'question_id': 'reg001',
            'category': 'registration',
            'question': 'how to register account sign up',
            'answer': '''To register for DALScooter:
1. Click on "Register" in the top menu
2. Fill in your personal details (name, email, phone)
3. Create a username and strong password
4. Verify your email address through the link sent
5. Set up multi-factor authentication:
   - Choose security questions and answers
   - Set up Caesar cipher preferences
6. Complete verification and start booking bikes!'''
        },
        {
            'question_id': 'bike001',
            'category': 'bikes',
            'question': 'bike types available gyroscooter ebike segway',
            'answer': '''We offer three amazing bike types:

🛴 **Gyroscooter**
- Perfect for short city rides and quick trips
- Easy to maneuver in traffic
- Starting from $5/hour

🚲 **eBikes** 
- Electric-powered for longer distances
- Eco-friendly with pedal assistance
- Starting from $8/hour

🛴 **Segway**
- Self-balancing personal transporter
- Ideal for sightseeing and leisure rides  
- Starting from $10/hour

Check our main page for real-time availability!'''
        },
        {
            'question_id': 'book001',
            'category': 'booking',
            'question': 'how to book reserve rent bike',
            'answer': '''Easy booking process:
1. **Log in** to your registered account
2. **Browse** available bikes by type and location
3. **Select** your preferred bike and time slot
4. **Choose** rental duration (minimum 1 hour)
5. **Confirm** your booking details
6. **Receive** booking reference code via email
7. **Get** your bike access code through me using your booking reference!

Payment is handled in-person when you pick up the bike.'''
        },
        {
            'question_id': 'price001',
            'category': 'pricing',
            'question': 'cost price rate rental fee',
            'answer': '''Our competitive rental rates:

💰 **Hourly Rates:**
- Gyroscooter: $5/hour
- eBikes: $8/hour  
- Segway: $10/hour

💳 **Discounts Available:**
- Students: 15% off with valid ID
- Monthly pass: 20% off regular rates
- Loyalty members: Up to 25% off

🎯 **Special Offers:**
Check our homepage for current promotional codes and seasonal discounts!'''
        },
        {
            'question_id': 'auth001',
            'category': 'authentication',
            'question': 'login multi factor authentication mfa',
            'answer': '''Secure 3-factor authentication process:

🔐 **Step 1:** Username & Password
🔍 **Step 2:** Security Question & Answer  
🔢 **Step 3:** Caesar Cipher Challenge

This ensures your account stays secure. If you forget any authentication details, use the "Forgot Password" link or contact support.'''
        },
        {
            'question_id': 'supp001',
            'category': 'support',
            'question': 'help support contact issue problem',
            'answer': '''Need help? We're here for you!

📞 **24/7 Hotline:** 1-800-DALSCOOT
📧 **Email:** support@dalscooter.com
💬 **Live Chat:** Available through this assistant
🎫 **Report Issues:** Use this chat to create support tickets

**Common Issues I Can Help With:**
- Getting bike access codes
- Booking problems  
- Account questions
- Technical difficulties'''
        }
    ]
    
    # Insert items into knowledge base
    for item in knowledge_items:
        try:
            table.put_item(Item=item)
            print(f"✅ Added knowledge item: {item['question_id']}")
        except Exception as e:
            print(f"❌ Error adding {item['question_id']}: {str(e)}")

def init_sample_bookings():
    """Initialize sample booking data for testing"""
    
    table_name = 'dalscooter-dev-booking-references'  # Update based on your naming
    table = dynamodb.Table(table_name)
    
    # Sample booking data
    now = datetime.now()
    bookings = [
        {
            'booking_reference': 'BK123456',
            'bike_type': 'eBike',
            'bike_number': 'EB001',
            'access_code': '7892',
            'start_time': now.strftime('%Y-%m-%d %H:%M'),
            'end_time': (now + timedelta(hours=2)).strftime('%Y-%m-%d %H:%M'),
            'rental_duration': '2 hours',
            'status': 'active',
            'customer_id': 'cust001',
            'created_at': now.isoformat()
        },
        {
            'booking_reference': 'BK789012',
            'bike_type': 'Gyroscooter',
            'bike_number': 'GS005',
            'access_code': '3456',
            'start_time': (now + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M'),
            'end_time': (now + timedelta(hours=4)).strftime('%Y-%m-%d %H:%M'),
            'rental_duration': '3 hours',
            'status': 'active',
            'customer_id': 'cust002',
            'created_at': now.isoformat()
        },
        {
            'booking_reference': 'BK345678',
            'bike_type': 'Segway',
            'bike_number': 'SW003',
            'access_code': '9012',
            'start_time': (now - timedelta(hours=2)).strftime('%Y-%m-%d %H:%M'),
            'end_time': (now + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M'),
            'rental_duration': '3 hours',
            'status': 'active',
            'customer_id': 'cust003',
            'created_at': (now - timedelta(hours=2)).isoformat()
        }
    ]
    
    # Insert booking data
    for booking in bookings:
        try:
            table.put_item(Item=booking)
            print(f"✅ Added booking: {booking['booking_reference']}")
        except Exception as e:
            print(f"❌ Error adding booking {booking['booking_reference']}: {str(e)}")

def main():
    """Main function to initialize all data"""
    print("🚀 Initializing DALScooter Virtual Assistant Data...")
    print("\n📚 Setting up Knowledge Base...")
    init_knowledge_base()
    
    print("\n🎫 Setting up Sample Bookings...")
    init_sample_bookings()
    
    print("\n✅ Data initialization complete!")
    print("\n🤖 Your virtual assistant is now ready to use!")
    print("\nTest phrases to try:")
    print("- 'How do I register?'")
    print("- 'What bikes are available?'")
    print("- 'Get access code for BK123456'")
    print("- 'I have an issue with my bike'")

if __name__ == "__main__":
    main()
    