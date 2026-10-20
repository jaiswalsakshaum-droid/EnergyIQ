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
        print("--> Training models (Phase 4)...")
        # Placeholder for training in Phase 4
        try:
            from app.services.training import train_all_models
            train_all_models()
        except ImportError:
            print("Note: Model training service will be active in Phase 4.")

    if args.command in ["detect", "all"]:
        print("--> Running anomaly detection ensemble (Phase 6)...")
        # Placeholder for anomaly detection in Phase 6
        try:
            from app.services.anomaly import run_anomaly_detection
            run_anomaly_detection()
        except ImportError:
            print("Note: Anomaly detection service will be active in Phase 6.")

if __name__ == "__main__":
    main()
