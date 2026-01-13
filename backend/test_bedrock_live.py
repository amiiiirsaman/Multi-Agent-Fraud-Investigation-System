"""Quick test script for Bedrock Nova Pro connectivity."""

import boto3
import json

client = boto3.client('bedrock-runtime', region_name='us-east-1')

response = client.invoke_model(
    modelId='amazon.nova-pro-v1:0',
    body=json.dumps({
        'inferenceConfig': {
            'max_new_tokens': 100,
            'temperature': 0.3,
        },
        'system': [{'text': 'You are a helpful assistant. Respond briefly.'}],
        'messages': [
            {
                'role': 'user',
                'content': [{'text': 'Say hello and confirm you are working.'}],
            }
        ],
    }),
)

response_body = json.loads(response['body'].read())
result = response_body['output']['message']['content'][0]['text']
print('SUCCESS:', result)
