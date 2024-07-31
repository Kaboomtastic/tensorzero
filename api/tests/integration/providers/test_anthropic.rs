use crate::integration::providers::common::{
    create_simple_inference_request, create_streaming_inference_request,
    create_tool_inference_request,
};
use api::inference::providers::provider_trait::InferenceProvider;
use api::{inference::providers::anthropic::AnthropicProvider, model::ProviderConfig};
use futures::StreamExt;
use secrecy::SecretString;
use std::env;

#[tokio::test]
async fn test_infer() {
    // Load API key from environment variable
    let api_key = env::var("ANTHROPIC_API_KEY").expect("ANTHROPIC_API_KEY must be set");
    let api_key = SecretString::new(api_key);
    let model_name = "claude-3-haiku-20240307";
    let config = ProviderConfig::Anthropic {
        model_name: model_name.to_string(),
        api_key: Some(api_key),
    };
    let client = reqwest::Client::new();
    let inference_request = create_simple_inference_request();
    let result = AnthropicProvider::infer(&inference_request, &config, &client).await;
    assert!(result.is_ok());
    assert!(result.unwrap().content.is_some());
}

#[tokio::test]
async fn test_infer_stream() {
    // Load API key from environment variable
    let api_key = env::var("ANTHROPIC_API_KEY").expect("ANTHROPIC_API_KEY must be set");
    let api_key = SecretString::new(api_key);
    let model_name = "claude-3-haiku-20240307";
    let config = ProviderConfig::Anthropic {
        model_name: model_name.to_string(),
        api_key: Some(api_key),
    };
    let client = reqwest::Client::new();
    let inference_request = create_streaming_inference_request();
    let result = AnthropicProvider::infer_stream(&inference_request, &config, &client).await;
    assert!(result.is_ok());
    let (chunk, mut stream) = result.unwrap();
    let mut collected_chunks = vec![chunk];
    while let Some(chunk) = stream.next().await {
        assert!(chunk.is_ok());
        collected_chunks.push(chunk.unwrap());
    }
    assert!(!collected_chunks.is_empty());
    assert!(collected_chunks.last().unwrap().content.is_some());
}

#[tokio::test]
async fn test_infer_with_tool_calls() {
    // Load API key from environment variable
    let api_key = env::var("ANTHROPIC_API_KEY").expect("ANTHROPIC_API_KEY must be set");
    let api_key = SecretString::new(api_key);
    let model_name = "claude-3-haiku-20240307";
    let client = reqwest::Client::new();

    let inference_request = create_tool_inference_request();
    let config = ProviderConfig::Anthropic {
        model_name: model_name.to_string(),
        api_key: Some(api_key),
    };
    let result = AnthropicProvider::infer(&inference_request, &config, &client).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert!(response.tool_calls.is_some());
    let tool_calls = response.tool_calls.unwrap();
    assert!(!tool_calls.is_empty());

    let first_tool_call = &tool_calls[0];
    assert_eq!(first_tool_call.name, "get_weather");

    // Parse the arguments to ensure they're valid JSON
    let arguments: serde_json::Value = serde_json::from_str(&first_tool_call.arguments)
        .expect("Failed to parse tool call arguments");
    assert!(arguments.get("location").is_some());
}