/* ResearchFlow seed data.
   In the full-stack phase this module is replaced by API calls to the
   FastAPI backend (MongoDB). Shapes match the planned API responses. */

const now = Date.now();
export const t = (minsAgo) => new Date(now - minsAgo * 60000).toISOString();
export const d = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();
export const future = (days, hour = 10) => {
  const x = new Date(now + days * 86400000);
  x.setHours(hour, 0, 0, 0);
  return x.toISOString();
};

export const USERS = [
  { id: 'u1', name: 'Santhosh Kumar', email: 'santhosh.kumar@researchflow.app', role: 'researcher', dept: 'Data Science', institution: 'Coimbatore Institute of Technology', interests: ['Deep Learning', 'Medical Imaging', 'MLOps'], joined: d(210) },
  { id: 'u2', name: 'Gopika Raman', email: 'gopika.raman@researchflow.app', role: 'researcher', dept: 'Biomedical Engineering', institution: 'Coimbatore Institute of Technology', interests: ['Biostatistics', 'Data Curation'], joined: d(190) },
  { id: 'u3', name: 'Dr. Meera Nair', email: 'meera.nair@researchflow.app', role: 'supervisor', dept: 'Computer Science', institution: 'PSG College of Technology', interests: ['Computer Vision', 'Research Pedagogy'], joined: d(400) },
  { id: 'u4', name: 'Dr. Rajesh Iyer', email: 'rajesh.iyer@researchflow.app', role: 'supervisor', dept: 'Information Systems', institution: 'Anna University', interests: ['Distributed Systems', 'Privacy'], joined: d(380) },
  { id: 'u5', name: 'Ananya Krishnan', email: 'ananya.k@researchflow.app', role: 'researcher', dept: 'Computer Science', institution: 'PSG College of Technology', interests: ['Federated Learning'], joined: d(120) },
  { id: 'u6', name: 'Vikram Shah', email: 'vikram.shah@researchflow.app', role: 'researcher', dept: 'Computer Science', institution: 'PSG College of Technology', interests: ['Cryptographic Protocols'], joined: d(115) },
  { id: 'u7', name: 'Dr. Fatima Zaidi', email: 'fatima.zaidi@researchflow.app', role: 'supervisor', dept: 'Agricultural Engineering', institution: 'TNAU', interests: ['Remote Sensing'], joined: d(350) },
  { id: 'u8', name: 'Arjun Patel', email: 'admin@researchflow.app', role: 'admin', dept: 'Platform', institution: 'ResearchFlow', interests: ['Platform Engineering'], joined: d(500) },
  { id: 'u9', name: 'Karthik Menon', email: 'karthik.m@researchflow.app', role: 'researcher', dept: 'Physics', institution: 'IIT Madras', interests: ['Quantum ML'], joined: d(40) },
  { id: 'u10', name: 'Divya Subramani', email: 'divya.s@researchflow.app', role: 'supervisor', dept: 'Chemistry', institution: 'IIT Madras', interests: ['Computational Chemistry'], joined: d(22) },
  { id: 'u11', name: 'Rahul Verma', email: 'rahul.v@researchflow.app', role: 'researcher', dept: 'Data Science', institution: 'Coimbatore Institute of Technology', interests: ['NLP'], joined: d(9) },
  { id: 'u12', name: 'Sneha Pillai', email: 'sneha.p@researchflow.app', role: 'researcher', dept: 'Economics', institution: 'Anna University', interests: ['Econometrics'], joined: d(4) },
];

export const PROJECTS = [
  {
    id: 'p1',
    title: 'AI-Based Early Disease Detection',
    desc: 'Developing and validating a deep learning pipeline for early detection of disease from chest imaging, with clinical-grade evaluation on a curated multi-center dataset.',
    objective: 'Build a diagnostic model that detects early-stage disease with sensitivity ≥ 92% at a false-positive rate ≤ 5%, and validate against clinical ground truth.',
    methodology: 'Retrospective multi-center imaging study. CNN and attention architectures trained with 5-fold cross-validation; ablations for architecture, augmentation and class imbalance; statistical validation against reader studies.',
    start: '2026-02-02',
    end: '2026-12-15',
    status: 'Active',
    priority: 'High',
    category: 'Medical AI',
    tags: ['deep-learning', 'diagnostics', 'imaging'],
    progress: 78,
    members: ['u1', 'u2', 'u3'],
  },
  {
    id: 'p2',
    title: 'Federated Learning for Privacy-Preserving Diagnostics',
    desc: 'Exploring federated optimization so diagnostic models can be trained across institutions without pooling raw patient data.',
    objective: 'Demonstrate that federated averaging with differential privacy reaches within 2% accuracy of centralized training across 3 simulated sites.',
    methodology: 'Simulated federated setup (3 sites), FedAvg and DP-SGD variants, communication-efficiency analysis.',
    start: '2026-04-01',
    end: '2026-11-30',
    status: 'Active',
    priority: 'Medium',
    category: 'Distributed ML',
    tags: ['federated-learning', 'privacy'],
    progress: 54,
    members: ['u5', 'u6', 'u4'],
  },
  {
    id: 'p3',
    title: 'Multi-Spectral Crop Stress Detection Using Drones',
    desc: 'Combining drone-captured multi-spectral imagery with field sensor data to detect crop water stress 72 hours before visible symptoms.',
    objective: 'Classify stress stages from drone imagery with ≥ 85% F1 using a lightweight model deployable on edge hardware.',
    methodology: 'Drone capture campaign, spectral feature engineering, comparison of CNN and gradient-boosted baselines.',
    start: '2026-06-15',
    end: '2027-02-28',
    status: 'Planning',
    priority: 'Low',
    category: 'AgriTech',
    tags: ['remote-sensing', 'edge-ml'],
    progress: 22,
    members: ['u1', 'u7'],
  },
];

export const MILESTONES = [
  { id: 'm1', projectId: 'p1', name: 'Literature Review', desc: 'Map the state of the art in imaging-based early detection.', start: '2026-02-02', due: '2026-03-15', status: 'Completed', progress: 100 },
  { id: 'm2', projectId: 'p1', name: 'Dataset Preparation', desc: 'Collect, clean and annotate 5,000 scans with expert labels.', start: '2026-03-16', due: '2026-05-30', status: 'Completed', progress: 100 },
  { id: 'm3', projectId: 'p1', name: 'Model Development', desc: 'Train and tune baseline and proposed architectures.', start: '2026-06-01', due: '2026-08-30', status: 'In Progress', progress: 85 },
  { id: 'm4', projectId: 'p1', name: 'Model Evaluation', desc: 'Statistical validation, ablations and reader-study comparison.', start: '2026-09-01', due: '2026-09-30', status: 'In Progress', progress: 40 },
  { id: 'm5', projectId: 'p1', name: 'Clinical Validation', desc: 'Prospective validation with the partner hospital.', start: '2026-10-01', due: '2026-11-15', status: 'Not Started', progress: 0 },
  { id: 'm6', projectId: 'p1', name: 'Final Research & Thesis', desc: 'Write-up, thesis submission and conference paper.', start: '2026-11-16', due: '2026-12-15', status: 'Not Started', progress: 0 },
  { id: 'm7', projectId: 'p2', name: 'FedAvg Baseline', desc: 'First stable federated run across the 3 simulated sites.', start: '2026-06-01', due: '2026-09-15', status: 'In Progress', progress: 55 },
  { id: 'm8', projectId: 'p2', name: 'DP-SGD Variant', desc: 'Differential-privacy variant with utility guarantees.', start: '2026-09-16', due: '2026-10-31', status: 'Not Started', progress: 0 },
];

export const TASKS = [
  { id: 't1', projectId: 'p1', title: 'Annotate remaining chest X-rays (300 images)', desc: 'Complete expert annotation for the third imaging batch using the labelling guideline v2.', assignee: 'u1', priority: 'High', due: '2026-09-05', status: 'todo', milestone: 'm2', comments: 2, attachments: 1 },
  { id: 't2', projectId: 'p1', title: 'Prepare ablation study plan', desc: 'Define ablation matrix: architecture, augmentation, loss, class weighting.', assignee: 'u2', priority: 'Medium', due: '2026-09-12', status: 'todo', milestone: 'm4', comments: 1, attachments: 0 },
  { id: 't3', projectId: 'p1', title: 'Draft protocol for sensitivity analysis', desc: 'Protocol for sensitivity at fixed FPR operating points.', assignee: 'u1', priority: 'Low', due: '2026-09-20', status: 'todo', milestone: 'm4', comments: 0, attachments: 0 },
  { id: 't4', projectId: 'p1', title: 'Tune CNN hyperparameters on fold 3', desc: 'Grid + random search over lr, batch size, weight decay; log every run.', assignee: 'u1', priority: 'High', due: '2026-09-02', status: 'in_progress', milestone: 'm3', comments: 5, attachments: 2 },
  { id: 't5', projectId: 'p1', title: 'Clean missing values in patient metadata', desc: 'Supervisor requested verification of the age column (4% missing).', assignee: 'u2', priority: 'High', due: '2026-08-28', status: 'in_progress', milestone: 'm3', comments: 4, attachments: 1 },
  { id: 't6', projectId: 'p1', title: 'Compile related-work section', desc: 'Structure: classical models → deep learning → attention → multi-modal.', assignee: 'u1', priority: 'Medium', due: '2026-09-18', status: 'in_progress', milestone: 'm6', comments: 1, attachments: 0 },
  { id: 't7', projectId: 'p1', title: 'Validate baseline ResNet results', desc: 'Re-run fold 1 inference on the clean dataset; verify metric parity.', assignee: 'u2', priority: 'Medium', due: '2026-08-30', status: 'review', milestone: 'm3', comments: 3, attachments: 1 },
  { id: 't8', projectId: 'p1', title: 'Write dataset description for the paper', desc: 'Size, provenance, splits, label distribution, ethics note.', assignee: 'u1', priority: 'Medium', due: '2026-09-08', status: 'review', milestone: 'm4', comments: 2, attachments: 0 },
  { id: 't9', projectId: 'p1', title: 'Collect initial dataset (5,000 scans)', desc: 'Multi-center collection with consent checks.', assignee: 'u1', priority: 'High', due: '2026-04-10', status: 'completed', milestone: 'm2', comments: 6, attachments: 3 },
  { id: 't10', projectId: 'p1', title: 'Build data pipeline', desc: 'Ingest, normalise, cache; reproducible preprocessing.', assignee: 'u2', priority: 'High', due: '2026-05-12', status: 'completed', milestone: 'm2', comments: 2, attachments: 1 },
  { id: 't11', projectId: 'p1', title: 'Implement baseline model', desc: 'ResNet50 baseline with standard augmentation.', assignee: 'u1', priority: 'High', due: '2026-06-15', status: 'completed', milestone: 'm3', comments: 4, attachments: 2 },
  { id: 't12', projectId: 'p1', title: 'Set up experiment tracking config', desc: 'Unified config + result logging for all runs.', assignee: 'u2', priority: 'Medium', due: '2026-06-20', status: 'completed', milestone: 'm3', comments: 1, attachments: 0 },
  { id: 't13', projectId: 'p2', title: 'Implement DP-SGD variant', desc: 'Clipped gradients + Gaussian noise schedule.', assignee: 'u5', priority: 'High', due: '2026-09-10', status: 'in_progress', milestone: 'm8', comments: 2, attachments: 0 },
  { id: 't14', projectId: 'p2', title: 'Simulate 3-site federated run', desc: 'Non-IID data split across sites.', assignee: 'u6', priority: 'Medium', due: '2026-09-15', status: 'todo', milestone: 'm7', comments: 0, attachments: 0 },
  { id: 't15', projectId: 'p2', title: 'Draft privacy threat model', desc: 'Membership-inference and gradient-leakage threats.', assignee: 'u5', priority: 'Medium', due: '2026-09-25', status: 'todo', milestone: 'm8', comments: 1, attachments: 0 },
  { id: 't16', projectId: 'p2', title: 'Baseline centralized training run', desc: 'Pooled-data reference.', assignee: 'u6', priority: 'High', due: '2026-08-20', status: 'completed', milestone: 'm7', comments: 3, attachments: 1 },
];

export const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', completed: 'Completed' };

export const DOCUMENTS = [
  { id: 'd1', projectId: 'p1', name: 'Literature_Review_v3.pdf', cat: 'Research Papers', uploader: 'u1', version: 3, sizeKB: 2458, type: 'pdf', date: t(2880), review: 'Under Review', versions: [{ v: 1, date: '2026-06-02', sizeKB: 1804 }, { v: 2, date: '2026-07-11', sizeKB: 2210 }, { v: 3, date: '2026-08-18', sizeKB: 2458 }] },
  { id: 'd2', projectId: 'p1', name: 'dataset_chest_xray_full.zip', cat: 'Datasets', uploader: 'u2', version: 2, sizeKB: 151552, type: 'zip', date: d(25), review: 'Approved', versions: [{ v: 1, date: '2026-07-02', sizeKB: 120200 }, { v: 2, date: '2026-07-30', sizeKB: 151552 }] },
  { id: 'd3', projectId: 'p1', name: 'Related_Work_Notes.md', cat: 'References', uploader: 'u1', version: 1, sizeKB: 84, type: 'md', date: d(35), review: 'Approved', versions: [{ v: 1, date: '2026-07-20', sizeKB: 84 }] },
  { id: 'd4', projectId: 'p1', name: 'baseline_results_fold1-3.csv', cat: 'Experiment Results', uploader: 'u2', version: 1, sizeKB: 128, type: 'csv', date: d(6), review: 'Pending Review', versions: [{ v: 1, date: '2026-08-18', sizeKB: 128 }] },
  { id: 'd5', projectId: 'p1', name: 'methodology_draft.docx', cat: 'Final Documents', uploader: 'u1', version: 2, sizeKB: 96, type: 'docx', date: d(4), review: 'Under Review', versions: [{ v: 1, date: '2026-08-02', sizeKB: 74 }, { v: 2, date: '2026-08-20', sizeKB: 96 }] },
  { id: 'd6', projectId: 'p1', name: 'pitch_slides_12.pptx', cat: 'Presentations', uploader: 'u3', version: 1, sizeKB: 5222, type: 'pptx', date: d(12), review: 'Approved', versions: [{ v: 1, date: '2026-08-12', sizeKB: 5222 }] },
  { id: 'd7', projectId: 'p1', name: 'patient_metadata_cleaned.csv', cat: 'Datasets', uploader: 'u2', version: 3, sizeKB: 4710, type: 'csv', date: d(2), review: 'Changes Requested', versions: [{ v: 1, date: '2026-07-15', sizeKB: 4520 }, { v: 2, date: '2026-07-28', sizeKB: 4640 }, { v: 3, date: '2026-08-22', sizeKB: 4710 }] },
  { id: 'd8', projectId: 'p1', name: 'ethics_approval.pdf', cat: 'References', uploader: 'u3', version: 1, sizeKB: 312, type: 'pdf', date: d(70), review: 'Approved', versions: [{ v: 1, date: '2026-06-15', sizeKB: 312 }] },
  { id: 'd9', projectId: 'p2', name: 'federated_setup_design.md', cat: 'References', uploader: 'u5', version: 1, sizeKB: 61, type: 'md', date: d(10), review: 'Approved', versions: [{ v: 1, date: '2026-08-14', sizeKB: 61 }] },
  { id: 'd10', projectId: 'p2', name: 'site_A_sample_data.parquet', cat: 'Datasets', uploader: 'u6', version: 1, sizeKB: 8842, type: 'parquet', date: d(8), review: 'Pending Review', versions: [{ v: 1, date: '2026-08-16', sizeKB: 8842 }] },
  { id: 'd11', projectId: 'p2', name: 'dp_sgd_benchmarks.pdf', cat: 'Experiment Results', uploader: 'u5', version: 2, sizeKB: 1204, type: 'pdf', date: d(3), review: 'Under Review', versions: [{ v: 1, date: '2026-08-05', sizeKB: 980 }, { v: 2, date: '2026-08-21', sizeKB: 1204 }] },
];

export const DOC_COMMENTS = [
  { id: 'c1', docId: 'd1', userId: 'u3', text: 'Check citation 14 — the 2024 study pre-dates your baseline claim, so the comparison needs reframing.', date: d(2) },
  { id: 'c2', docId: 'd1', userId: 'u1', text: 'Reframed the comparison in §2.3 and added the reader-study reference.', date: d(1) },
  { id: 'c3', docId: 'd7', userId: 'u3', text: 'Please verify missing values in the age column — 4% looks too high for a consented cohort.', date: d(3) },
  { id: 'c4', docId: 'd7', userId: 'u2', text: 'Re-ran the cleaning pipeline; missing rate is now 0.8%. Uploaded v3.', date: d(2) },
];

export const EXPERIMENTS = [
  { id: 'e1', projectId: 'p1', title: 'Baseline ResNet50 — fold 1', objective: 'Establish the reference performance.', hypothesis: 'A standard ResNet50 with standard augmentation reaches ~0.87 accuracy on fold 1.', methodology: 'Standard training recipe, 20 epochs, lr 1e-3.', dataset: 'chest_xray_full v1', parameters: [['backbone', 'ResNet50'], ['lr', '0.001'], ['batch_size', '32'], ['epochs', '20']], status: 'Completed', date: '2026-06-20', metrics: [['Accuracy', '0.871'], ['AUC', '0.912'], ['Sensitivity', '0.894'], ['FPR', '0.061']], conclusion: 'Baseline established. Sensitivity on small nodules is the weak point.' },
  { id: 'e2', projectId: 'p1', title: 'Baseline ResNet50 — folds 2–3', objective: 'Verify cross-fold stability.', hypothesis: 'Performance variance across folds is < 0.01.', methodology: 'Same recipe on folds 2 and 3.', dataset: 'chest_xray_full v1', parameters: [['backbone', 'ResNet50'], ['lr', '0.001'], ['epochs', '20']], status: 'Completed', date: '2026-06-28', metrics: [['Accuracy', '0.871 ± 0.003'], ['AUC', '0.913 ± 0.004']], conclusion: 'Low variance (σ = 0.003) — results are stable across folds.' },
  { id: 'e3', projectId: 'p1', title: 'EfficientNet-B4 + augmentation', objective: 'Test a stronger backbone.', hypothesis: 'EfficientNet-B4 with strong augmentation beats ResNet50 by ≥ 1.5% accuracy.', methodology: 'AutoAugment + cutmix, 30 epochs.', dataset: 'chest_xray_full v2', parameters: [['backbone', 'EfficientNet-B4'], ['lr', '0.0005'], ['batch_size', '16'], ['epochs', '30']], status: 'Running', date: '2026-08-21', metrics: [['Accuracy (fold 1)', '0.891']], conclusion: '' },
  { id: 'e4', projectId: 'p1', title: 'Attention-guided CNN (proposed)', objective: 'Test whether spatial attention on lung regions improves sensitivity on small nodules.', hypothesis: 'Attention over pulmonary regions raises sensitivity on nodules < 5mm without increasing FPR.', methodology: 'CAM-based attention head on top of EfficientNet-B4 features.', dataset: 'chest_xray_full v2', parameters: [['backbone', 'EfficientNet-B4 + attn'], ['lr', '0.0003']], status: 'Planned', date: '2026-09-01', metrics: [], conclusion: '' },
  { id: 'e5', projectId: 'p1', title: 'Data augmentation — random erasing', objective: 'Measure the effect of random erasing (20%).', hypothesis: 'Random erasing improves generalisation by ~0.5–1% accuracy.', methodology: 'Ablation on the ResNet50 recipe.', dataset: 'chest_xray_full v2', parameters: [['backbone', 'ResNet50'], ['erasing', '0.2']], status: 'Completed', date: '2026-07-19', metrics: [['Accuracy', '0.879'], ['Δ vs baseline', '+0.008']], conclusion: 'Keep random erasing at 20% in all future runs.' },
  { id: 'e6', projectId: 'p1', title: 'Class imbalance — focal loss', objective: 'Improve minority-class recall.', hypothesis: 'Focal loss (γ = 2) improves minority-class recall at equal FPR.', methodology: 'Replace CE with focal loss on the ResNet50 recipe.', dataset: 'chest_xray_full v2', parameters: [['backbone', 'ResNet50'], ['loss', 'focal γ=2']], status: 'Under Review', date: '2026-08-15', metrics: [['Accuracy', '0.884'], ['Minority recall', '+6.2%']], conclusion: 'Supervisor review pending — verify the FPR trade-off before adoption.' },
  { id: 'e7', projectId: 'p1', title: 'Synthetic minority class generation (GAN)', objective: 'Increase minority samples with a GAN.', hypothesis: 'Generated samples raise minority-class recall by ≥ 3%.', methodology: 'Conditional GAN on latent features.', dataset: 'chest_xray_full v2', parameters: [['gan', 'conditional DCGAN'], ['epochs', '80']], status: 'Failed', date: '2026-07-30', metrics: [['Accuracy', '0.858']], conclusion: 'Training diverged; L1 penalty too high. Parked until a more stable generator is available.' },
  { id: 'e8', projectId: 'p2', title: 'Centralized baseline (3 sites pooled)', objective: 'Reference for the federated comparison.', hypothesis: 'Pooled training is the accuracy ceiling.', methodology: 'Standard SGD on pooled simulated data.', dataset: 'site data v1', parameters: [['epochs', '10']], status: 'Completed', date: '2026-08-20', metrics: [['Accuracy', '0.842']], conclusion: 'Ceiling established.' },
  { id: 'e9', projectId: 'p2', title: 'FedAvg — 3 sites, 5 rounds', objective: 'First federated run.', hypothesis: 'FedAvg reaches within 3% of centralized after 5 rounds.', methodology: 'FedAvg, 10 local epochs per round.', dataset: 'site data v1', parameters: [['algorithm', 'FedAvg'], ['rounds', '5']], status: 'Running', date: '2026-08-22', metrics: [['Round 3 accuracy', '0.816']], conclusion: '' },
];

export const FINDINGS = [
  { id: 'f1', projectId: 'p1', experiment: 'e3', title: 'EfficientNet-B4 outperforms the ResNet50 baseline', desc: 'Fold-1 results for the EfficientNet-B4 + augmentation run.', evidence: 'Fold 1: 0.891 accuracy / 0.923 AUC vs 0.871 / 0.912 for the ResNet50 baseline (exp. e1).', result: '+2.0% accuracy, +1.1% AUC over baseline.', interpretation: 'The stronger backbone is the main driver; augmentation contributes ~0.8% (cf. e5).', conclusion: 'Adopt EfficientNet-B4 as the primary architecture for the evaluation phase.', files: ['efficientnet_fold1_curves.png'], by: 'u1', date: d(2) },
  { id: 'f2', projectId: 'p1', experiment: 'e5', title: 'Random erasing (20%) improves generalisation', desc: 'Ablation result on the baseline recipe.', evidence: '0.879 with erasing vs 0.871 without (e1 / e5).', result: '+0.8% accuracy, stable across folds.', interpretation: 'Regularisation effect; no change in FPR.', conclusion: 'Keep 20% random erasing in all future runs.', files: [], by: 'u1', date: d(36) },
  { id: 'f3', projectId: 'p1', experiment: 'e6', title: 'Focal loss improves minority-class recall', desc: 'Trade-off analysis under review.', evidence: 'Minority-class recall +6.2% at equal FPR (e6).', result: 'Recall gain with negligible FPR cost in the current run.', interpretation: 'Promising, but the FPR measurement needs the clean metadata before adoption.', conclusion: 'Adopt after supervisor review confirms the FPR trade-off.', files: [], by: 'u2', date: d(9) },
  { id: 'f4', projectId: 'p1', experiment: 'e2', title: 'Cross-validation variance is low', desc: 'Stability check across folds 1–3.', evidence: 'σ = 0.003 accuracy across folds (e2).', result: 'Highly consistent performance.', interpretation: 'The dataset split is well balanced; results are reproducible.', conclusion: 'No action required; report in the methods section.', files: [], by: 'u1', date: d(58) },
];

export const DISCUSSIONS = [
  {
    id: 'th1', projectId: 'p1', title: 'Dataset quality: missing values in age column',
    body: 'We need to reconcile the 4% missing values in the age column before the evaluation phase. My concern is that the missingness may be correlated with severity.',
    by: 'u3', date: d(3), pinned: true, resolved: false,
    replies: [
      { id: 'r1', by: 'u1', body: 'The pipeline was imputing with the cohort median, which was hiding the real rate. I will report the true missing rate per site.', date: d(3), reactions: {} },
      { id: 'r2', by: 'u2', body: 'Re-ran the cleaning without imputation — true missing rate is 0.8% after the consent-form cross-check. Re-uploaded the CSV (v3).', date: d(2), reactions: { '👍': 2 } },
      { id: 'r3', by: 'u3', body: 'That resolves my concern. Let us document the consent-form cross-check in the methods section.', date: d(1), reactions: { '🙏': 1 } },
    ],
  },
  {
    id: 'th2', projectId: 'p1', title: 'Model selection for the final paper',
    body: 'For the paper, do we lead with EfficientNet-B4 or the attention-guided variant?',
    by: 'u1', date: d(6), pinned: false, resolved: true,
    replies: [
      { id: 'r4', by: 'u3', body: 'Lead with EfficientNet-B4 (solid evidence) and present the attention variant as the proposed contribution once e4 completes.', date: d(5), reactions: { '💡': 2 } },
      { id: 'r5', by: 'u1', body: 'Agreed — that matches the evaluation milestone timeline.', date: d(5), reactions: {} },
    ],
  },
  {
    id: 'th3', projectId: 'p1', title: 'Conference deadline planning',
    body: 'The spring symposium abstract deadline is 2026-10-01. We need the full results by early September to be safe.',
    by: 'u3', date: d(12), pinned: false, resolved: false,
    replies: [
      { id: 'r6', by: 'u2', body: 'If e3 and e6 finish by 2026-09-15, we have two weeks for writing. Feasible but tight.', date: d(11), reactions: { '📅': 1 } },
    ],
  },
];

export const MEETINGS = [
  { id: 'mt1', projectId: 'p1', title: 'Weekly Sync', date: future(1, 10), time: '10:00', participants: ['u1', 'u2', 'u3'], agenda: ['e3 progress review', 'Ablation plan sign-off', 'Dataset v3 verification'], desc: 'Regular project sync.', link: 'https://meet.researchflow.app/rs-8f21a', status: 'scheduled', notes: '', actions: [] },
  { id: 'mt2', projectId: 'p1', title: 'Model Evaluation Review', date: future(5, 15), time: '15:00', participants: ['u1', 'u3'], agenda: ['Evaluation protocol', 'Reader-study comparison design'], desc: 'Supervisor review of the evaluation plan.', link: 'https://meet.researchflow.app/mr-3c90d', status: 'scheduled', notes: '', actions: [] },
  { id: 'mt3', projectId: 'p1', title: 'Weekly Sync', date: d(6), time: '10:00', participants: ['u1', 'u2', 'u3'], agenda: ['Baseline results', 'Augmentation ablation'], desc: '', link: 'https://meet.researchflow.app/rs-2b77c', status: 'completed', notes: 'Decided to adopt EfficientNet-B4 as the primary architecture. Focal-loss experiment goes to supervisor review. Age-column missingness to be reconciled before evaluation.', actions: [{ text: 'Re-upload metadata without imputation', done: true }, { text: 'Draft ablation matrix', done: false }] },
  { id: 'mt4', projectId: 'p1', title: 'Dataset Validation', date: d(13), time: '14:00', participants: ['u2', 'u3'], agenda: ['Annotation quality spot-check'], desc: '', link: 'https://meet.researchflow.app/dv-91f4e', status: 'completed', notes: 'Annotation inter-rater agreement 0.91 — above the 0.85 threshold. No re-annotation needed.', actions: [{ text: 'Document IRR score in methods', done: true }] },
];

export const NOTIFICATIONS = [
  { id: 'n1', type: 'task', title: 'Task assigned', body: 'Meera Nair assigned “Tune CNN hyperparameters on fold 3” to you.', time: t(95), read: false },
  { id: 'n2', type: 'comment', title: 'Supervisor commented on Literature Review v3', body: '“Check citation 14 — the 2024 study pre-dates your baseline claim…”', time: t(240), read: false },
  { id: 'n3', type: 'review', title: 'Changes requested', body: 'Meera Nair requested changes on patient_metadata_cleaned.csv (v3).', time: t(430), read: false },
  { id: 'n4', type: 'meeting', title: 'Meeting scheduled', body: 'Weekly Sync starts tomorrow at 10:00 with Gopika and Dr. Nair.', time: t(1400), read: false },
  { id: 'n5', type: 'deadline', title: 'Deadline approaching', body: 'Milestone “Model Evaluation” is due in 37 days.', time: t(1500), read: true },
  { id: 'n6', type: 'experiment', title: 'Experiment under review', body: '“Class imbalance — focal loss” is awaiting supervisor review.', time: t(2900), read: true },
  { id: 'n7', type: 'doc', title: 'Document approved', body: 'ethics_approval.pdf was approved by Dr. Nair.', time: t(10080), read: true },
  { id: 'n8', type: 'discussion', title: 'New reply in “Dataset quality”', body: 'Gopika: “Re-ran the cleaning pipeline; missing rate is now 0.8%…”', time: t(300), read: false },
];

export const ACTIVITY = [
  { id: 'a1', projectId: 'p1', userId: 'u2', verb: 'uploaded', noun: 'patient_metadata_cleaned.csv (v3)', time: t(480) },
  { id: 'a2', projectId: 'p1', userId: 'u1', verb: 'moved “Tune CNN hyperparameters on fold 3” to', noun: 'In Progress', time: t(95) },
  { id: 'a3', projectId: 'p1', userId: 'u2', verb: 'recorded experiment', noun: 'EfficientNet-B4 + augmentation', time: t(600) },
  { id: 'a4', projectId: 'p1', userId: 'u3', verb: 'commented on', noun: 'Literature_Review_v3.pdf', time: t(240) },
  { id: 'a5', projectId: 'p1', userId: 'u3', verb: 'replied in', noun: '“Dataset quality: missing values”', time: t(1500) },
  { id: 'a6', projectId: 'p1', userId: 'u1', verb: 'submitted for review', noun: 'methodology_draft.docx (v2)', time: d(2) },
  { id: 'a7', projectId: 'p2', userId: 'u5', verb: 'recorded experiment', noun: 'FedAvg — 3 sites, 5 rounds', time: d(2) },
  { id: 'a8', projectId: 'p1', userId: 'u3', verb: 'scheduled meeting', noun: 'Model Evaluation Review', time: d(4) },
  { id: 'a9', projectId: 'p1', userId: 'u1', verb: 'completed', noun: 'Set up experiment tracking config', time: d(58) },
  { id: 'a10', projectId: 'p1', userId: 'u2', verb: 'added finding', noun: 'Random erasing (20%) improves generalisation', time: d(36) },
  { id: 'a11', projectId: 'p1', userId: 'u3', verb: 'approved', noun: 'dataset_chest_xray_full.zip (v2)', time: d(25) },
  { id: 'a12', projectId: 'p1', userId: 'u1', verb: 'joined project', noun: '', time: d(210) },
];

export const CHAT_SEED = [
  { id: 'cs1', projectId: 'p1', userId: 'u3', text: 'Morning team — before the sync, can someone verify the age-column fix in metadata v3?', date: t(300), file: null },
  { id: 'cs2', projectId: 'p1', userId: 'u2', text: 'Done — missing rate is now 0.8% after the consent-form cross-check. CSV v3 is in the Datasets folder.', date: t(280), file: null },
  { id: 'cs3', projectId: 'p1', userId: 'u1', text: 'I will use v3 for the fold-3 tuning run and post the config here @Gopika Raman', date: t(260), file: null },
  { id: 'cs4', projectId: 'p1', userId: 'u3', text: 'Perfect. Also — the evaluation protocol draft is in review, I left two comments.', date: t(240), file: null },
  { id: 'cs5', projectId: 'p1', userId: 'u2', text: 'Will address them this afternoon. 🙌', date: t(230), file: null },
  { id: 'cs6', projectId: 'p2', userId: 'u4', text: 'Reminder: threat-model draft is due at the end of the week.', date: t(1500), file: null },
  { id: 'cs7', projectId: 'p2', userId: 'u5', text: 'On it — first pass will be in Discussions by Thursday.', date: t(1400), file: null },
];

/* ── Analytics series ─────────────────────────────────────────── */
export const WEEKLY_ACTIVITY = [
  { week: 'W-11', events: 14, tasks: 4, docs: 1, experiments: 0 },
  { week: 'W-10', events: 18, tasks: 5, docs: 2, experiments: 1 },
  { week: 'W-9', events: 16, tasks: 4, docs: 1, experiments: 1 },
  { week: 'W-8', events: 22, tasks: 6, docs: 3, experiments: 1 },
  { week: 'W-7', events: 19, tasks: 5, docs: 2, experiments: 2 },
  { week: 'W-6', events: 25, tasks: 7, docs: 3, experiments: 1 },
  { week: 'W-5', events: 21, tasks: 5, docs: 2, experiments: 2 },
  { week: 'W-4', events: 28, tasks: 8, docs: 4, experiments: 2 },
  { week: 'W-3', events: 26, tasks: 6, docs: 3, experiments: 1 },
  { week: 'W-2', events: 31, tasks: 9, docs: 4, experiments: 2 },
  { week: 'W-1', events: 29, tasks: 7, docs: 3, experiments: 2 },
  { week: 'Now', events: 34, tasks: 8, docs: 5, experiments: 3 },
];

export const TASK_TREND = [
  { week: 'W-9', completed: 1, open: 8 },
  { week: 'W-8', completed: 2, open: 9 },
  { week: 'W-7', completed: 3, open: 9 },
  { week: 'W-6', completed: 2, open: 10 },
  { week: 'W-5', completed: 4, open: 10 },
  { week: 'W-4', completed: 3, open: 11 },
  { week: 'W-3', completed: 5, open: 11 },
  { week: 'W-2', completed: 4, open: 12 },
  { week: 'W-1', completed: 6, open: 12 },
  { week: 'Now', completed: 8, open: 10 },
];

export const MONTHLY_DOCS = [
  { month: 'Mar', docs: 6 },
  { month: 'Apr', docs: 11 },
  { month: 'May', docs: 14 },
  { month: 'Jun', docs: 19 },
  { month: 'Jul', docs: 17 },
  { month: 'Aug', docs: 9 },
];

export const CONTRIBUTIONS = [
  { name: 'Santhosh K.', hours: 62 },
  { name: 'Gopika R.', hours: 48 },
  { name: 'Dr. Meera N.', hours: 21 },
];

/* 12 weeks × 7 days intensity (0–10), deterministic */
export const HEATMAP = Array.from({ length: 12 }, (_, w) =>
  Array.from({ length: 7 }, (_, day) => ((w * 13 + day * 7 + w * day) % 11))
);

export const ADMIN_LOGS = [
  { id: 'l1', userId: 'u12', action: 'user_registered', target: 'Sneha Pillai', time: t(60) },
  { id: 'l2', userId: 'u3', action: 'project_created', target: 'AI-Based Early Disease Detection', time: d(210) },
  { id: 'l3', userId: 'u8', action: 'role_changed', target: 'Gopika Raman → Researcher', time: d(150) },
  { id: 'l4', userId: 'u2', action: 'document_uploaded', target: 'patient_metadata_cleaned.csv (v3)', time: t(480) },
  { id: 'l5', userId: 'u3', action: 'document_reviewed', target: 'Literature_Review_v3.pdf', time: t(240) },
  { id: 'l6', userId: 'u1', action: 'task_completed', target: 'Set up experiment tracking config', time: d(58) },
  { id: 'l7', userId: 'u4', action: 'project_created', target: 'Federated Learning for Privacy-Preserving Diagnostics', time: d(120) },
  { id: 'l8', userId: 'u11', action: 'user_registered', target: 'Rahul Verma', time: d(9) },
  { id: 'l9', userId: 'u8', action: 'settings_updated', target: 'AI model → qwen3:4b', time: d(3) },
  { id: 'l10', userId: 'u10', action: 'user_registered', target: 'Divya Subramani', time: d(22) },
  { id: 'l11', userId: 'u2', action: 'experiment_created', target: 'EfficientNet-B4 + augmentation', time: d(3) },
  { id: 'l12', userId: 'u8', action: 'user_suspended', target: '1 inactive account', time: d(15) },
];

export const USER_GROWTH = [
  { month: 'Mar', users: 2 },
  { month: 'Apr', users: 5 },
  { month: 'May', users: 7 },
  { month: 'Jun', users: 9 },
  { month: 'Jul', users: 11 },
  { month: 'Aug', users: 12 },
];

export const STORAGE = { usedGB: 12.4, totalGB: 50 };

export const JOURNEY_STEPS = [
  { key: 'Idea', desc: 'Capture the research question, objective and methodology.' },
  { key: 'Literature Review', desc: 'Curate papers and references in the research library.' },
  { key: 'Dataset Preparation', desc: 'Collect, clean and version your datasets with full traceability.' },
  { key: 'Experimentation', desc: 'Record every run — parameters, metrics, outcomes.' },
  { key: 'Analysis', desc: 'Turn results into findings with evidence and interpretation.' },
  { key: 'Final Research', desc: 'Synthesise, review and publish with confidence.' },
];
