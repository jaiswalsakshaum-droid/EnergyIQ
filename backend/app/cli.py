import argparse
import sys
from app.db.session import init_db
from app.services.synthetic import seed_database

def main():
    parser = argparse.ArgumentParser(description="EnergyIQ CLI management utility")
    parser.add_argument("command", choices=["seed", "train", "detect", "all"], help="Command to execute")
    parser.add_argument("--days", type=int, default=365, help="Number of days of data to generate (default: 365)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic generation (default: 42)")

    args = parser.parse_args()

    init_db()

    if args.command in ["seed", "all"]:
        print(f"--> Seeding database with {args.days} days of realistic building readings (seed={args.seed})...")
        seed_database(days=args.days, seed=args.seed)
        print("--> Database seeding complete.")

    if args.command in ["train", "all"]:
        print("--> Training and evaluating all forecasting models with walk-forward CV...")
        from app.services.training import train_and_evaluate_all
        train_and_evaluate_all(test_days=14, tune_xgboost=True)
        print("--> Model training complete and artifacts persisted.")

    if args.command in ["detect", "all"]:
        print("--> Running anomaly detection ensemble and evaluating metrics against ground truth...")
        from app.services.anomaly import run_anomaly_detection_pipeline, evaluate_anomaly_metrics
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            incidents = run_anomaly_detection_pipeline(db)
            metrics = evaluate_anomaly_metrics(db)
            print(f"--> Detected {len(incidents)} consolidated incidents.")
            print(f"--> Evaluation against Ground Truth: Precision={metrics.precision}%, Recall={metrics.recall}%, F1={metrics.f1_score}%, Delay={metrics.mean_detection_delay_minutes}min")
        finally:
            db.close()

if __name__ == "__main__":
    main()
