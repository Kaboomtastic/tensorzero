use anyhow::Result;
use clap::Parser;
use evaluations::{run_evaluation, Args};
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<()> {
    let evaluation_run_id = Uuid::now_v7();
    let args = Args::parse();
    let mut writer = std::io::stdout();
    run_evaluation(args, evaluation_run_id, &mut writer).await
}
