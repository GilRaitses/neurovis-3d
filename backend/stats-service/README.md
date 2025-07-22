# Statistical Analysis Microservice

Flask-based microservice for deterministic statistical calculations in the NeuroCircuit.Science platform.

## Purpose

Replaces placeholder `Math.random()` statistical methods in the Angular frontend with proper scientific calculations using Python's scipy and statsmodels libraries.

## Endpoints

### Health Check
```
GET /health
Response: {"status": "healthy", "service": "stats-service"}
```

### Shapiro-Wilk Normality Test
```
POST /shapiro-wilk
Input: {"data": [1.2, 2.3, 3.4, 4.5, 5.6]}
Output: {
  "statistic": 0.95,
  "p_value": 0.123,
  "is_normal": true,
  "interpretation": "normal"
}
```

### One-Sample T-Test
```
POST /t-test
Input: {"data": [1,2,3], "mu0": 2.0, "test_type": "one-sample"}
Output: {
  "statistic": 1.23,
  "p_value": 0.045,
  "significant": true,
  "sample_mean": 2.0,
  "sample_std": 1.0
}
```

### Descriptive Statistics
```
POST /descriptive-stats
Input: {"data": [1,2,3,4,5]}
Output: {
  "n": 5,
  "mean": 3.0,
  "std": 1.58,
  "sem": 0.71,
  "ci_95_lower": 1.2,
  "ci_95_upper": 4.8,
  "median": 3.0,
  "q25": 2.0,
  "q75": 4.0
}
```

### Complete Envelope Analysis
```
POST /envelope-analysis
Input: {"envelope_data": [...], "baseline_mu": 0.0}
Output: {
  "descriptive": {...},
  "normality": {...},
  "t_test": {...},
  "recommendation": {
    "use_parametric": true,
    "effect_size": 1.2
  }
}
```

## Setup

```bash
cd backend/stats-service
pip install -r requirements.txt
python app.py
```

The service will run on `http://localhost:5000`

## Angular Integration

Update `envelope-model.service.ts` to call these endpoints instead of using placeholder calculations. 