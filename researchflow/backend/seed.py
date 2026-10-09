"""Seed MongoDB with the ResearchFlow demo dataset.

Mirrors src/lib/mock.js exactly (same ids, names, texts) but computes all
timestamps relative to NOW so Today/Yesterday groupings work whenever the
seed runs.  Text documents are written to the storage directory and indexed
into the RAG chunk collection.

Usage:  python seed.py [--force] [--admin-password researchflow]
"""
import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings  # noqa: E402
from app.db import close_db, init_db, new_id, _db_name  # noqa: E402
from app.security import hash_password  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

NOW = datetime.now(timezone.utc)


def t(mins_ago: int) -> str:
    return (NOW - timedelta(minutes=mins_ago)).isoformat()


def d(days_ago: int) -> str:
    return (NOW - timedelta(days=days_ago)).isoformat()


def date_only(days_ago: int) -> str:
    return (NOW - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def future(days: int, hour: int = 10) -> str:
    x = NOW + timedelta(days=days)
    return x.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


USERS = [
    ("u1", "Santhosh Kumar", "santhosh.kumar@researchflow.app", "researcher", "Data Science", "Coimbatore Institute of Technology", ["Deep Learning", "Medical Imaging", "MLOps"], 210),
    ("u2", "Gopika Raman", "gopika.raman@researchflow.app", "researcher", "Biomedical Engineering", "Coimbatore Institute of Technology", ["Biostatistics", "Data Curation"], 190),
    ("u3", "Dr. Meera Nair", "meera.nair@researchflow.app", "supervisor", "Computer Science", "PSG College of Technology", ["Computer Vision", "Research Pedagogy"], 400),
    ("u4", "Dr. Rajesh Iyer", "rajesh.iyer@researchflow.app", "supervisor", "Information Systems", "Anna University", ["Distributed Systems", "Privacy"], 380),
    ("u5", "Ananya Krishnan", "ananya.k@researchflow.app", "researcher", "Computer Science", "PSG College of Technology", ["Federated Learning"], 120),
    ("u6", "Vikram Shah", "vikram.shah@researchflow.app", "researcher", "Computer Science", "PSG College of Technology", ["Cryptographic Protocols"], 115),
    ("u7", "Dr. Fatima Zaidi", "fatima.zaidi@researchflow.app", "supervisor", "Agricultural Engineering", "TNAU", ["Remote Sensing"], 350),
    ("u8", "Arjun Patel", "admin@researchflow.app", "admin", "Platform", "ResearchFlow", ["Platform Engineering"], 500),
    ("u9", "Karthik Menon", "karthik.m@researchflow.app", "researcher", "Physics", "IIT Madras", ["Quantum ML"], 40),
    ("u10", "Divya Subramani", "divya.s@researchflow.app", "supervisor", "Chemistry", "IIT Madras", ["Computational Chemistry"], 22),
    ("u11", "Rahul Verma", "rahul.v@researchflow.app", "researcher", "Data Science", "Coimbatore Institute of Technology", ["NLP"], 9),
    ("u12", "Sneha Pillai", "sneha.p@researchflow.app", "researcher", "Economics", "Anna University", ["Econometrics"], 4),
]

PROJECTS = [
    ("p1", "AI-Based Early Disease Detection",
     "Developing and validating a deep learning pipeline for early detection of disease from chest imaging, with clinical-grade evaluation on a curated multi-center dataset.",
     "Build a diagnostic model that detects early-stage disease with sensitivity ≥ 92% at a false-positive rate ≤ 5%, and validate against clinical ground truth.",
     "Retrospective multi-center imaging study. CNN and attention architectures trained with 5-fold cross-validation; ablations for architecture, augmentation and class imbalance; statistical validation against reader studies.",
     "2026-02-02", "2026-12-15", "Active", "High", "Medical AI", ["deep-learning", "diagnostics", "imaging"], 78, ["u1", "u2", "u3"]),
    ("p2", "Federated Learning for Privacy-Preserving Diagnostics",
     "Exploring federated optimization so diagnostic models can be trained across institutions without pooling raw patient data.",
     "Demonstrate that federated averaging with differential privacy reaches within 2% accuracy of centralized training across 3 simulated sites.",
     "Simulated federated setup (3 sites), FedAvg and DP-SGD variants, communication-efficiency analysis.",
     "2026-04-01", "2026-11-30", "Active", "Medium", "Distributed ML", ["federated-learning", "privacy"], 54, ["u5", "u6", "u4"]),
    ("p3", "Multi-Spectral Crop Stress Detection Using Drones",
     "Combining drone-captured multi-spectral imagery with field sensor data to detect crop water stress 72 hours before visible symptoms.",
     "Classify stress stages from drone imagery with ≥ 85% F1 using a lightweight model deployable on edge hardware.",
     "Drone capture campaign, spectral feature engineering, comparison of CNN and gradient-boosted baselines.",
     "2026-06-15", "2027-02-28", "Planning", "Low", "AgriTech", ["remote-sensing", "edge-ml"], 22, ["u1", "u7"]),
]

MILESTONES = [
    ("m1", "p1", "Literature Review", "Map the state of the art in imaging-based early detection.", "2026-02-02", "2026-03-15", "Completed", 100),
    ("m2", "p1", "Dataset Preparation", "Collect, clean and annotate 5,000 scans with expert labels.", "2026-03-16", "2026-05-30", "Completed", 100),
    ("m3", "p1", "Model Development", "Train and tune baseline and proposed architectures.", "2026-06-01", "2026-08-30", "In Progress", 85),
    ("m4", "p1", "Model Evaluation", "Statistical validation, ablations and reader-study comparison.", "2026-09-01", "2026-09-30", "In Progress", 40),
    ("m5", "p1", "Clinical Validation", "Prospective validation with the partner hospital.", "2026-10-01", "2026-11-15", "Not Started", 0),
    ("m6", "p1", "Final Research & Thesis", "Write-up, thesis submission and conference paper.", "2026-11-16", "2026-12-15", "Not Started", 0),
    ("m7", "p2", "FedAvg Baseline", "First stable federated run across the 3 simulated sites.", "2026-06-01", "2026-09-15", "In Progress", 55),
    ("m8", "p2", "DP-SGD Variant", "Differential-privacy variant with utility guarantees.", "2026-09-16", "2026-10-31", "Not Started", 0),
]

# (id, projectId, title, desc, assignee, priority, due(date_only), status, milestone, comments, attachments, created_days_ago)
TASKS = [
    ("t1", "p1", "Annotate remaining chest X-rays (300 images)", "Complete expert annotation for the third imaging batch using the labelling guideline v2.", "u1", "High", 45, "todo", "m2", 2, 1, 60),
    ("t2", "p1", "Prepare ablation study plan", "Define ablation matrix: architecture, augmentation, loss, class weighting.", "u2", "Medium", 52, "todo", "m4", 1, 0, 40),
    ("t3", "p1", "Draft protocol for sensitivity analysis", "Protocol for sensitivity at fixed FPR operating points.", "u1", "Low", 60, "todo", "m4", 0, 0, 38),
    ("t4", "p1", "Tune CNN hyperparameters on fold 3", "Grid + random search over lr, batch size, weight decay; log every run.", "u1", "High", 38, "in_progress", "m3", 5, 2, 55),
    ("t5", "p1", "Clean missing values in patient metadata", "Supervisor requested verification of the age column (4% missing).", "u2", "High", 14, "in_progress", "m3", 4, 1, 20),
    ("t6", "p1", "Compile related-work section", "Structure: classical models → deep learning → attention → multi-modal.", "u1", "Medium", 55, "in_progress", "m6", 1, 0, 30),
    ("t7", "p1", "Validate baseline ResNet results", "Re-run fold 1 inference on the clean dataset; verify metric parity.", "u2", "Medium", 16, "review", "m3", 3, 1, 25),
    ("t8", "p1", "Write dataset description for the paper", "Size, provenance, splits, label distribution, ethics note.", "u1", "Medium", 44, "review", "m4", 2, 0, 22),
    ("t9", "p1", "Collect initial dataset (5,000 scans)", "Multi-center collection with consent checks.", "u1", "High", -130, "completed", "m2", 6, 3, 170),
    ("t10", "p1", "Build data pipeline", "Ingest, normalise, cache; reproducible preprocessing.", "u2", "High", -100, "completed", "m2", 2, 1, 150),
    ("t11", "p1", "Implement baseline model", "ResNet50 baseline with standard augmentation.", "u1", "High", -65, "completed", "m3", 4, 2, 120),
    ("t12", "p1", "Set up experiment tracking config", "Unified config + result logging for all runs.", "u2", "Medium", -60, "completed", "m3", 1, 0, 115),
    ("t13", "p2", "Implement DP-SGD variant", "Clipped gradients + Gaussian noise schedule.", "u5", "High", 46, "in_progress", "m8", 2, 0, 45),
    ("t14", "p2", "Simulate 3-site federated run", "Non-IID data split across sites.", "u6", "Medium", 51, "todo", "m7", 0, 0, 44),
    ("t15", "p2", "Draft privacy threat model", "Membership-inference and gradient-leakage threats.", "u5", "Medium", 61, "todo", "m8", 1, 0, 43),
    ("t16", "p2", "Baseline centralized training run", "Pooled-data reference.", "u6", "High", -6, "completed", "m7", 3, 1, 90),
]

# (id, projectId, name, cat, uploader, version, sizeKB, type, date(days_ago), review, versions[(v, days_ago, sizeKB)])
DOCUMENTS = [
    ("d1", "p1", "Literature_Review_v3.pdf", "Research Papers", "u1", 3, 2458, "pdf", 2, "Under Review", [(1, 84, 1804), (2, 45, 2210), (3, 8, 2458)]),
    ("d2", "p1", "dataset_chest_xray_full.zip", "Datasets", "u2", 2, 151552, "zip", 25, "Approved", [(1, 54, 120200), (2, 26, 151552)]),
    ("d3", "p1", "Related_Work_Notes.md", "References", "u1", 1, 84, "md", 35, "Approved", [(1, 35, 84)]),
    ("d4", "p1", "baseline_results_fold1-3.csv", "Experiment Results", "u2", 1, 128, "csv", 6, "Pending Review", [(1, 6, 128)]),
    ("d5", "p1", "methodology_draft.docx", "Final Documents", "u1", 2, 96, "docx", 4, "Under Review", [(1, 24, 74), (2, 4, 96)]),
    ("d6", "p1", "pitch_slides_12.pptx", "Presentations", "u3", 1, 5222, "pptx", 12, "Approved", [(1, 12, 5222)]),
    ("d7", "p1", "patient_metadata_cleaned.csv", "Datasets", "u2", 3, 4710, "csv", 2, "Changes Requested", [(1, 41, 4520), (2, 28, 4640), (3, 2, 4710)]),
    ("d8", "p1", "ethics_approval.pdf", "References", "u3", 1, 312, "pdf", 70, "Approved", [(1, 70, 312)]),
    ("d9", "p2", "federated_setup_design.md", "References", "u5", 1, 61, "md", 10, "Approved", [(1, 10, 61)]),
    ("d10", "p2", "site_A_sample_data.parquet", "Datasets", "u6", 1, 8842, "parquet", 8, "Pending Review", [(1, 8, 8842)]),
    ("d11", "p2", "dp_sgd_benchmarks.pdf", "Experiment Results", "u5", 2, 1204, "pdf", 3, "Under Review", [(1, 20, 980), (2, 3, 1204)]),
]

DOC_COMMENTS = [
    ("c1", "d1", "u3", "Check citation 14 — the 2024 study pre-dates your baseline claim, so the comparison needs reframing.", 2),
    ("c2", "d1", "u1", "Reframed the comparison in §2.3 and added the reader-study reference.", 1),
    ("c3", "d7", "u3", "Please verify missing values in the age column — 4% looks too high for a consented cohort.", 3),
    ("c4", "d7", "u2", "Re-ran the cleaning pipeline; missing rate is now 0.8%. Uploaded v3.", 2),
]

# (id, projectId, title, objective, hypothesis, methodology, dataset, parameters, status, date(days_ago), metrics, conclusion)
EXPERIMENTS = [
    ("e1", "p1", "Baseline ResNet50 — fold 1", "Establish the reference performance.", "A standard ResNet50 with standard augmentation reaches ~0.87 accuracy on fold 1.", "Standard training recipe, 20 epochs, lr 1e-3.", "chest_xray_full v1",
     [["backbone", "ResNet50"], ["lr", "0.001"], ["batch_size", "32"], ["epochs", "20"]], "Completed", 66,
     [["Accuracy", "0.871"], ["AUC", "0.912"], ["Sensitivity", "0.894"], ["FPR", "0.061"]], "Baseline established. Sensitivity on small nodules is the weak point."),
    ("e2", "p1", "Baseline ResNet50 — folds 2–3", "Verify cross-fold stability.", "Performance variance across folds is < 0.01.", "Same recipe on folds 2 and 3.", "chest_xray_full v1",
     [["backbone", "ResNet50"], ["lr", "0.001"], ["epochs", "20"]], "Completed", 58,
     [["Accuracy", "0.871 ± 0.003"], ["AUC", "0.913 ± 0.004"]], "Low variance (σ = 0.003) — results are stable across folds."),
    ("e3", "p1", "EfficientNet-B4 + augmentation", "Test a stronger backbone.", "EfficientNet-B4 with strong augmentation beats ResNet50 by ≥ 1.5% accuracy.", "AutoAugment + cutmix, 30 epochs.", "chest_xray_full v2",
     [["backbone", "EfficientNet-B4"], ["lr", "0.0005"], ["batch_size", "16"], ["epochs", "30"]], "Running", 4,
     [["Accuracy (fold 1)", "0.891"]], ""),
    ("e4", "p1", "Attention-guided CNN (proposed)", "Test whether spatial attention on lung regions improves sensitivity on small nodules.", "Attention over pulmonary regions raises sensitivity on nodules < 5mm without increasing FPR.", "CAM-based attention head on top of EfficientNet-B4 features.", "chest_xray_full v2",
     [["backbone", "EfficientNet-B4 + attn"], ["lr", "0.0003"]], "Planned", -8, [], ""),
    ("e5", "p1", "Data augmentation — random erasing", "Measure the effect of random erasing (20%).", "Random erasing improves generalisation by ~0.5–1% accuracy.", "Ablation on the ResNet50 recipe.", "chest_xray_full v2",
     [["backbone", "ResNet50"], ["erasing", "0.2"]], "Completed", 37,
     [["Accuracy", "0.879"], ["Δ vs baseline", "+0.008"]], "Keep random erasing at 20% in all future runs."),
    ("e6", "p1", "Class imbalance — focal loss", "Improve minority-class recall.", "Focal loss (γ = 2) improves minority-class recall at equal FPR.", "Replace CE with focal loss on the ResNet50 recipe.", "chest_xray_full v2",
     [["backbone", "ResNet50"], ["loss", "focal γ=2"]], "Under Review", 10,
     [["Accuracy", "0.884"], ["Minority recall", "+6.2%"]], "Supervisor review pending — verify the FPR trade-off before adoption."),
    ("e7", "p1", "Synthetic minority class generation (GAN)", "Increase minority samples with a GAN.", "Generated samples raise minority-class recall by ≥ 3%.", "Conditional GAN on latent features.", "chest_xray_full v2",
     [["gan", "conditional DCGAN"], ["epochs", "80"]], "Failed", 26,
     [["Accuracy", "0.858"]], "Training diverged; L1 penalty too high. Parked until a more stable generator is available."),
    ("e8", "p2", "Centralized baseline (3 sites pooled)", "Reference for the federated comparison.", "Pooled training is the accuracy ceiling.", "Standard SGD on pooled simulated data.", "site data v1",
     [["epochs", "10"]], "Completed", 5,
     [["Accuracy", "0.842"]], "Ceiling established."),
    ("e9", "p2", "FedAvg — 3 sites, 5 rounds", "First federated run.", "FedAvg reaches within 3% of centralized after 5 rounds.", "FedAvg, 10 local epochs per round.", "site data v1",
     [["algorithm", "FedAvg"], ["rounds", "5"]], "Running", 3,
     [["Round 3 accuracy", "0.816"]], ""),
]

# (id, projectId, experiment, title, desc, evidence, result, interpretation, conclusion, files, by, days_ago)
FINDINGS = [
    ("f1", "p1", "e3", "EfficientNet-B4 outperforms the ResNet50 baseline", "Fold-1 results for the EfficientNet-B4 + augmentation run.",
     "Fold 1: 0.891 accuracy / 0.923 AUC vs 0.871 / 0.912 for the ResNet50 baseline (exp. e1).", "+2.0% accuracy, +1.1% AUC over baseline.",
     "The stronger backbone is the main driver; augmentation contributes ~0.8% (cf. e5).", "Adopt EfficientNet-B4 as the primary architecture for the evaluation phase.",
     ["efficientnet_fold1_curves.png"], "u1", 2),
    ("f2", "p1", "e5", "Random erasing (20%) improves generalisation", "Ablation result on the baseline recipe.",
     "0.879 with erasing vs 0.871 without (e1 / e5).", "+0.8% accuracy, stable across folds.",
     "Regularisation effect; no change in FPR.", "Keep 20% random erasing in all future runs.", [], "u1", 36),
    ("f3", "p1", "e6", "Focal loss improves minority-class recall", "Trade-off analysis under review.",
     "Minority-class recall +6.2% at equal FPR (e6).", "Recall gain with negligible FPR cost in the current run.",
     "Promising, but the FPR measurement needs the clean metadata before adoption.", "Adopt after supervisor review confirms the FPR trade-off.", [], "u2", 9),
    ("f4", "p1", "e2", "Cross-validation variance is low", "Stability check across folds 1–3.",
     "σ = 0.003 accuracy across folds (e2).", "Highly consistent performance.",
     "The dataset split is well balanced; results are reproducible.", "No action required; report in the methods section.", [], "u1", 58),
]

DISCUSSIONS = [
    ("th1", "p1", "Dataset quality: missing values in age column",
     "We need to reconcile the 4% missing values in the age column before the evaluation phase. My concern is that the missingness may be correlated with severity.",
     "u3", 3, True, False,
     [
         ("r1", "u1", "The pipeline was imputing with the cohort median, which was hiding the real rate. I will report the true missing rate per site.", 3, {}),
         ("r2", "u2", "Re-ran the cleaning without imputation — true missing rate is 0.8% after the consent-form cross-check. Re-uploaded the CSV (v3).", 2, {"👍": ["u1", "u3"]}),
         ("r3", "u3", "That resolves my concern. Let us document the consent-form cross-check in the methods section.", 1, {"🙏": ["u2"]}),
     ]),
    ("th2", "p1", "Model selection for the final paper",
     "For the paper, do we lead with EfficientNet-B4 or the attention-guided variant?",
     "u1", 6, False, True,
     [
         ("r4", "u3", "Lead with EfficientNet-B4 (solid evidence) and present the attention variant as the proposed contribution once e4 completes.", 5, {"💡": ["u1", "u2"]}),
         ("r5", "u1", "Agreed — that matches the evaluation milestone timeline.", 5, {}),
     ]),
    ("th3", "p1", "Conference deadline planning",
     "The spring symposium abstract deadline is 2026-10-01. We need the full results by early September to be safe.",
     "u3", 12, False, False,
     [
         ("r6", "u2", "If e3 and e6 finish by 2026-09-15, we have two weeks for writing. Feasible but tight.", 11, {"📅": ["u1"]}),
     ]),
]

# (id, projectId, title, date, time, participants, agenda, desc, link, status, notes, actions)
MEETINGS = [
    ("mt1", "p1", "Weekly Sync", future(1, 10), "10:00", ["u1", "u2", "u3"],
     ["e3 progress review", "Ablation plan sign-off", "Dataset v3 verification"], "Regular project sync.",
     "https://meet.researchflow.app/rs-8f21a", "scheduled", "", []),
    ("mt2", "p1", "Model Evaluation Review", future(5, 15), "15:00", ["u1", "u3"],
     ["Evaluation protocol", "Reader-study comparison design"], "Supervisor review of the evaluation plan.",
     "https://meet.researchflow.app/mr-3c90d", "scheduled", "", []),
    ("mt3", "p1", "Weekly Sync", d(6), "10:00", ["u1", "u2", "u3"],
     ["Baseline results", "Augmentation ablation"], "",
     "https://meet.researchflow.app/rs-2b77c", "completed",
     "Decided to adopt EfficientNet-B4 as the primary architecture. Focal-loss experiment goes to supervisor review. Age-column missingness to be reconciled before evaluation.",
     [{"text": "Re-upload metadata without imputation", "done": True}, {"text": "Draft ablation matrix", "done": False}]),
    ("mt4", "p1", "Dataset Validation", d(13), "14:00", ["u2", "u3"],
     ["Annotation quality spot-check"], "",
     "https://meet.researchflow.app/dv-91f4e", "completed",
     "Annotation inter-rater agreement 0.91 — above the 0.85 threshold. No re-annotation needed.",
     [{"text": "Document IRR score in methods", "done": True}]),
]

# (id, userId, type, title, body, mins_ago, read)
NOTIFICATIONS = [
    ("n1", "u1", "task", "Task assigned", "Meera Nair assigned “Tune CNN hyperparameters on fold 3” to you.", 95, False),
    ("n2", "u1", "comment", "Supervisor commented on Literature Review v3", "“Check citation 14 — the 2024 study pre-dates your baseline claim…”", 240, False),
    ("n3", "u1", "review", "Changes requested", "Meera Nair requested changes on patient_metadata_cleaned.csv (v3).", 430, False),
    ("n4", "u1", "meeting", "Meeting scheduled", "Weekly Sync starts tomorrow at 10:00 with Gopika and Dr. Nair.", 1400, False),
    ("n5", "u1", "deadline", "Deadline approaching", "Milestone “Model Evaluation” is due in 37 days.", 1500, True),
    ("n6", "u1", "experiment", "Experiment under review", "“Class imbalance — focal loss” is awaiting supervisor review.", 2900, True),
    ("n7", "u1", "doc", "Document approved", "ethics_approval.pdf was approved by Dr. Nair.", 10080, True),
    ("n8", "u1", "discussion", "New reply in “Dataset quality”", "Gopika: “Re-ran the cleaning pipeline; missing rate is now 0.8%…”", 300, False),
    ("n9", "u3", "review", "Document submitted for review", "Santhosh submitted methodology_draft.docx (v2) for review.", 480, False),
    ("n10", "u3", "experiment", "Experiment under review", "“Class imbalance — focal loss” is awaiting your review.", 1000, False),
    ("n11", "u3", "task", "Task due soon", "“Clean missing values in patient metadata” is due in 14 days.", 1500, True),
    ("n12", "u8", "system", "New user registered", "Sneha Pillai created an account (researcher).", 60, False),
    ("n13", "u8", "system", "Storage report", "Weekly storage digest: 12.4 GB used of 50 GB.", 4000, True),
]

# (id, projectId, userId, verb, noun, time)
ACTIVITY = [
    ("a1", "p1", "u2", "uploaded", "patient_metadata_cleaned.csv (v3)", t(480)),
    ("a2", "p1", "u1", "moved “Tune CNN hyperparameters on fold 3” to", "In Progress", t(95)),
    ("a3", "p1", "u2", "recorded experiment", "EfficientNet-B4 + augmentation", t(600)),
    ("a4", "p1", "u3", "commented on", "Literature_Review_v3.pdf", t(240)),
    ("a5", "p1", "u3", "replied in", "“Dataset quality: missing values”", t(1500)),
    ("a6", "p1", "u1", "submitted for review", "methodology_draft.docx (v2)", d(2)),
    ("a7", "p2", "u5", "recorded experiment", "FedAvg — 3 sites, 5 rounds", d(2)),
    ("a8", "p1", "u3", "scheduled meeting", "Model Evaluation Review", d(4)),
    ("a9", "p1", "u1", "completed", "Set up experiment tracking config", d(58)),
    ("a10", "p1", "u2", "added finding", "Random erasing (20%) improves generalisation", d(36)),
    ("a11", "p1", "u3", "approved", "dataset_chest_xray_full.zip (v2)", d(25)),
    ("a12", "p1", "u1", "joined project", "", d(210)),
]

CHAT = [
    ("cs1", "p1", "u3", "Morning team — before the sync, can someone verify the age-column fix in metadata v3?", t(300)),
    ("cs2", "p1", "u2", "Done — missing rate is now 0.8% after the consent-form cross-check. CSV v3 is in the Datasets folder.", t(280)),
    ("cs3", "p1", "u1", "I will use v3 for the fold-3 tuning run and post the config here @Gopika Raman", t(260)),
    ("cs4", "p1", "u3", "Perfect. Also — the evaluation protocol draft is in review, I left two comments.", t(240)),
    ("cs5", "p1", "u2", "Will address them this afternoon. 🙌", t(230)),
    ("cs6", "p2", "u4", "Reminder: threat-model draft is due at the end of the week.", t(1500)),
    ("cs7", "p2", "u5", "On it — first pass will be in Discussions by Thursday.", t(1400)),
]

# (id, userId, action, target, time)
ADMIN_LOGS = [
    ("l1", "u12", "user_registered", "Sneha Pillai", t(60)),
    ("l2", "u3", "project_created", "AI-Based Early Disease Detection", d(210)),
    ("l3", "u8", "role_changed", "Gopika Raman → Researcher", d(150)),
    ("l4", "u2", "document_uploaded", "patient_metadata_cleaned.csv (v3)", t(480)),
    ("l5", "u3", "document_reviewed", "Literature_Review_v3.pdf", t(240)),
    ("l6", "u1", "task_completed", "Set up experiment tracking config", d(58)),
    ("l7", "u4", "project_created", "Federated Learning for Privacy-Preserving Diagnostics", d(120)),
    ("l8", "u11", "user_registered", "Rahul Verma", d(9)),
    ("l9", "u8", "settings_updated", "AI model → qwen3:4b", d(3)),
    ("l10", "u10", "user_registered", "Divya Subramani", d(22)),
    ("l11", "u2", "experiment_created", "EfficientNet-B4 + augmentation", d(3)),
    ("l12", "u8", "user_suspended", "1 inactive account", d(15)),
]

# ---------------------------------------------------------------------------
# Real file contents for the RAG-indexed text documents
# ---------------------------------------------------------------------------

RELATED_WORK = """# Related Work Notes — AI-Based Early Disease Detection

## 1. Classical detection models
Early chest-imaging work relied on hand-crafted features (HOG, LBP) with SVM or
random-forest classifiers. These pipelines were interpretable but plateaus below
0.80 AUC on modern multi-center data, and they do not transfer across scanners.

## 2. Convolutional neural networks
Fully convolutional architectures (U-Net, ResNet, DenseNet) became the standard
for image-level classification. Our baseline ResNet50 reaches 0.871 accuracy /
0.912 AUC on fold 1, consistent with published single-center results. The main
weakness is sensitivity on small nodules (< 5 mm).

## 3. Attention and localization
Attention-guided variants (CAM-based heads, transformers with regional tokens)
improve sensitivity on small lesions by focusing capacity on pulmonary regions.
This motivates our proposed experiment e4 (attention-guided CNN on top of
EfficientNet-B4 features).

## 4. Augmentation and class imbalance
AutoAugment, mixup and cutmix give 0.5-1% accuracy on imbalanced datasets.
Focal loss (gamma = 2) improves minority-class recall by about 6% at equal FPR
in our preliminary run e6, but the FPR trade-off needs verification on the
clean metadata before adoption. Random erasing at 20% is a free 0.8% (e5).

## 5. Multi-modal and reader studies
Combining imaging with clinical metadata (age, sex, smoking history) adds 1-2%
in some studies. Prospective reader studies remain the gold standard for
clinical validation; our clinical validation milestone m5 plans a partner-hospital
study with sensitivity >= 92% at FPR <= 5%.

## Key citations to verify
- Citation 14 (2024 study) pre-dates our baseline claim; the comparison in §2.3
  was reframed to a reader-study reference.
"""

BASELINE_RESULTS = """fold,backbone,accuracy,auc,sensitivity,fpr,notes
1,ResNet50,0.871,0.912,0.894,0.061,baseline
2,ResNet50,0.869,0.911,0.890,0.058,baseline
3,ResNet50,0.874,0.915,0.897,0.063,baseline
1,ResNet50+erasing,0.879,0.918,0.901,0.059,random erasing 20%
1,ResNet50+focal,0.884,0.919,0.909,0.061,focal loss gamma=2
1,EfficientNetB4,0.891,0.923,0.918,0.055,stronger backbone + augmentation
"""

PATIENT_METADATA = """patient_id,site,age,sex,smoking_history,consent_verified
P0001,A,54,M,yes,true
P0002,A,61,F,no,true
P0003,A,,M,yes,true
P0004,B,48,F,no,true
P0005,B,72,M,no,false
P0006,B,59,M,yes,true
P0007,C,66,F,no,true
P0008,C,51,M,no,true
P0009,C,,F,yes,true
P0010,C,63,M,no,true
P0011,A,70,F,no,true
P0012,B,57,M,yes,true
P0013,C,45,F,no,true
P0014,A,68,M,no,true
P0015,B,,F,no,true

Cleaning notes (v3): missing age rate 0.8% after consent-form cross-check
(previously imputed with cohort median, which hid the true rate).
Site B consent flag reviewed; 1 record excluded from training splits.
"""

FEDERATED_SETUP = """# Federated Setup Design — Privacy-Preserving Diagnostics

## Objective
Demonstrate that federated averaging with differential privacy reaches within
2% accuracy of centralized training across 3 simulated sites, without ever
pooling raw patient data.

## Sites
- Site A: 40% of patients, mild class imbalance (1.9:1)
- Site B: 35% of patients, scanner drift (different acquisition pipeline)
- Site C: 25% of patients, severe imbalance (3.4:1)

## Algorithms
1. FedAvg — 10 local epochs per round, 5 global rounds, cosine LR schedule.
2. DP-SGD — gradient clipping norm 1.0, noise multiplier 1.1, target epsilon
   ~8.0 per round; composition across rounds tracked with the moment accountant.

## Metrics
Track per-round: global accuracy, AUC, per-site accuracy spread, communication
rounds to convergence, and privacy budget consumed.

## Threat model
Membership-inference and gradient-leakage threats are documented in the
threat-model draft (discussion thread, due end of week). The DP-SGD variant
must stay within 2% of the centralized ceiling (0.842, exp. e8) to meet the
project objective.
"""

TEXT_DOCS = {
    "d3": (RELATED_WORK, "Related_Work_Notes.md"),
    "d4": (BASELINE_RESULTS, "baseline_results_fold1-3.csv"),
    "d7": (PATIENT_METADATA, "patient_metadata_cleaned.csv"),
    "d9": (FEDERATED_SETUP, "federated_setup_design.md"),
}


async def seed(force: bool, admin_password: str, user_password: str = "research123") -> None:
    client = AsyncIOMotorClient(settings.database_url, serverSelectionTimeoutMS=5000)
    db = client[_db_name(settings.database_url)]
    if force:
        names = [c for c in await db.list_collection_names()]
        for n in names:
            await db.drop_collection(n)
        print(f"[seed] dropped {len(names)} collections in db '{db.name}'")

    # storage dir + text files for RAG
    os.makedirs(settings.storage_dir, exist_ok=True)

    # --- users ---
    for uid, name, email, role, dept, inst, interests, joined in USERS:
        exists = await db.users.find_one({"_id": uid})
        if exists:
            if role == "admin":
                await db.users.update_one(
                    {"_id": uid},
                    {"$set": {"email": settings.admin_email, "password": hash_password(admin_password)}},
                )
            continue
        if role == "admin":
            email = settings.admin_email
        pw = admin_password if role == "admin" else user_password
        await db.users.insert_one(
            {"_id": uid, "name": name, "email": email, "password": hash_password(pw), "role": role,
             "dept": dept, "institution": inst, "interests": interests, "joined": d(joined),
             "status": "active", "avatar": None}
        )
    print(f"[seed] users: {await db.users.count_documents({})}")

    # --- projects ---
    for pid, title, desc, objective, methodology, start, end, status, priority, category, tags, progress, members in PROJECTS:
        if not await db.projects.find_one({"_id": pid}):
            await db.projects.insert_one(
                {"_id": pid, "title": title, "desc": desc, "objective": objective, "methodology": methodology,
                 "start": start, "end": end, "status": status, "priority": priority, "category": category,
                 "tags": tags, "progress": progress, "members": members}
            )
    print(f"[seed] projects: {await db.projects.count_documents({})}")

    # --- milestones ---
    for mid, pid, name, desc, start, due, status, progress in MILESTONES:
        if not await db.milestones.find_one({"_id": mid}):
            await db.milestones.insert_one({"_id": mid, "projectId": pid, "name": name, "desc": desc,
                                            "start": start, "due": due, "status": status, "progress": progress})

    # --- tasks ---
    for tid, pid, title, desc, assignee, priority, due_off, status, milestone, comments, attachments, created in TASKS:
        if not await db.tasks.find_one({"_id": tid}):
            await db.tasks.insert_one(
                {"_id": tid, "projectId": pid, "title": title, "desc": desc, "assignee": assignee,
                 "priority": priority, "due": date_only(due_off), "status": status, "milestone": milestone,
                 "comments": comments, "attachments": attachments, "createdAt": d(created)}
            )

    # --- documents (+ real files for text types) ---
    from app.services import embeddings, storage

    for did, pid, name, cat, uploader, version, size_kb, dtype, days, review, versions in DOCUMENTS:
        if await db.documents.find_one({"_id": did}):
            continue
        doc_versions = []
        path = None
        for (v, vdays, vkb) in versions:
            vdate = date_only(vdays)
            if v == version and did in TEXT_DOCS:
                content, fname = TEXT_DOCS[did]
                saved = storage.save_file(content.encode("utf-8"), fname, subdir="docs")
                path = saved["url"]
            else:
                # non-RAG docs: tiny placeholder file so downloads always work
                placeholder = f"ResearchFlow placeholder object\n{name} v{v} ({vkb} KB in production)\n"
                saved = storage.save_file(placeholder.encode("utf-8"), name, subdir="docs")
            doc_versions.append({"v": v, "date": vdate, "sizeKB": vkb, "path": saved["url"]})
        doc = {"_id": did, "projectId": pid, "name": name, "cat": cat, "uploader": uploader,
               "version": version, "sizeKB": size_kb, "type": dtype, "date": d(days),
               "review": review, "path": doc_versions[-1]["path"], "versions": doc_versions}
        await db.documents.insert_one(doc)
        if did in TEXT_DOCS:
            n = await embeddings.upsert_chunks(db, pid, did, name, TEXT_DOCS[did][0])
            print(f"[seed] RAG indexed {name}: {n} chunks")

    # --- doc comments ---
    for cid, doc_id, user_id, text, days in DOC_COMMENTS:
        if not await db.doc_comments.find_one({"_id": cid}):
            await db.doc_comments.insert_one({"_id": cid, "docId": doc_id, "userId": user_id, "text": text, "date": d(days)})

    # --- experiments ---
    for eid, pid, title, objective, hypothesis, methodology, dataset, params, status, days, metrics, conclusion in EXPERIMENTS:
        if not await db.experiments.find_one({"_id": eid}):
            await db.experiments.insert_one(
                {"_id": eid, "projectId": pid, "title": title, "objective": objective, "hypothesis": hypothesis,
                 "methodology": methodology, "dataset": dataset, "parameters": params, "status": status,
                 "date": date_only(days), "metrics": metrics, "conclusion": conclusion}
            )

    # --- findings ---
    for fid, pid, exp, title, desc, evidence, result, interpretation, conclusion, files, by, days in FINDINGS:
        if not await db.findings.find_one({"_id": fid}):
            await db.findings.insert_one(
                {"_id": fid, "projectId": pid, "experiment": exp, "title": title, "desc": desc, "evidence": evidence,
                 "result": result, "interpretation": interpretation, "conclusion": conclusion, "files": files,
                 "by": by, "date": d(days)}
            )

    # --- discussions ---
    for tid, pid, title, body, by, days, pinned, resolved, replies in DISCUSSIONS:
        if not await db.discussions.find_one({"_id": tid}):
            await db.discussions.insert_one(
                {"_id": tid, "projectId": pid, "title": title, "body": body, "by": by, "date": d(days),
                 "pinned": pinned, "resolved": resolved,
                 "replies": [{"id": rid, "by": rby, "body": rbody, "date": d(rdays), "reactors": reactors}
                             for (rid, rby, rbody, rdays, reactors) in replies]}
            )

    # --- meetings ---
    for mid, pid, title, date, time, participants, agenda, desc, link, status, notes, actions in MEETINGS:
        if not await db.meetings.find_one({"_id": mid}):
            await db.meetings.insert_one(
                {"_id": mid, "projectId": pid, "title": title, "date": date, "time": time, "participants": participants,
                 "agenda": agenda, "desc": desc, "link": link, "status": status, "notes": notes, "actions": actions}
            )

    # --- notifications ---
    for nid, user_id, ntype, title, body, mins, read in NOTIFICATIONS:
        if not await db.notifications.find_one({"_id": nid}):
            await db.notifications.insert_one({"_id": nid, "userId": user_id, "type": ntype, "title": title,
                                               "body": body, "time": t(mins), "read": read})

    # --- activity ---
    for aid, pid, user_id, verb, noun, time in ACTIVITY:
        if not await db.activity.find_one({"_id": aid}):
            await db.activity.insert_one({"_id": aid, "projectId": pid, "userId": user_id, "verb": verb,
                                          "noun": noun, "time": time})

    # --- chat ---
    for cid, pid, user_id, text, date in CHAT:
        if not await db.messages.find_one({"_id": cid}):
            await db.messages.insert_one({"_id": cid, "projectId": pid, "userId": user_id, "text": text,
                                          "date": date, "file": None})

    # --- admin logs ---
    for lid, user_id, action, target, time in ADMIN_LOGS:
        if not await db.admin_logs.find_one({"_id": lid}):
            await db.admin_logs.insert_one({"_id": lid, "userId": user_id, "action": action, "target": target,
                                            "time": time})

    # --- indexes (same as app startup) ---
    from app.db import _ensure_indexes

    _ensure_indexes(db)

    client.close()
    print(f"[seed] done. Demo login: santhosh.kumar@researchflow.app / {user_password} (all seeded users share this password)")
    print(f"[seed] Admin login:    {settings.admin_email} / {admin_password}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed the ResearchFlow MongoDB database.")
    ap.add_argument("--force", action="store_true", help="Drop all collections first")
    ap.add_argument("--admin-password", default=settings.admin_password)
    ap.add_argument("--user-password", default=os.environ.get("SEED_USER_PASSWORD", "research123"))
    args = ap.parse_args()
    import asyncio

    asyncio.run(seed(args.force, args.admin_password, args.user_password))


if __name__ == "__main__":
    main()
