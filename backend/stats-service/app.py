from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy import stats
import pandas as pd
from statsmodels.stats.diagnostic import normal_ad
import logging
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "stats-service", "version": "1.0.0"})

@app.route('/shapiro-wilk', methods=['POST'])
def shapiro_wilk_test():
    """
    Perform Shapiro-Wilk normality test
    Input: {"data": [1.2, 2.3, 3.4, ...]}
    Output: {"statistic": 0.95, "p_value": 0.123, "is_normal": true}
    """
    try:
        data = request.json.get('data')
        if not data or len(data) < 3:
            return jsonify({
                "error": "Shapiro-Wilk requires at least 3 data points",
                "statistic": None,
                "p_value": 1.0,
                "is_normal": True
            }), 400
        
        # Convert to numpy array
        data_array = np.array(data, dtype=float)
        
        # Perform Shapiro-Wilk test
        statistic, p_value = stats.shapiro(data_array)
        
        logger.info(f"Shapiro-Wilk: n={len(data)}, statistic={statistic:.4f}, p={p_value:.4f}")
        
        return jsonify({
            "statistic": float(statistic),
            "p_value": float(p_value),
            "is_normal": p_value > 0.05,
            "alpha": 0.05,
            "interpretation": "normal" if p_value > 0.05 else "non-normal"
        })
        
    except Exception as e:
        logger.error(f"Shapiro-Wilk error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/t-test', methods=['POST'])
def t_test():
    """
    Perform one-sample or two-sample t-test
    Input: {"data": [1,2,3], "mu0": 2.0, "test_type": "one-sample"}
    Output: {"statistic": 1.23, "p_value": 0.045, "significant": true}
    """
    try:
        data = request.json.get('data')
        test_type = request.json.get('test_type', 'one-sample')
        alpha = request.json.get('alpha', 0.05)
        
        if not data or len(data) < 2:
            return jsonify({"error": "T-test requires at least 2 data points"}), 400
        
        data_array = np.array(data, dtype=float)
        
        if test_type == 'one-sample':
            mu0 = request.json.get('mu0', 0.0)
            statistic, p_value = stats.ttest_1samp(data_array, mu0)
            
            return jsonify({
                "test_type": "one-sample",
                "statistic": float(statistic),
                "p_value": float(p_value),
                "mu0": mu0,
                "sample_mean": float(np.mean(data_array)),
                "sample_std": float(np.std(data_array, ddof=1)),
                "significant": p_value < alpha,
                "alpha": alpha
            })
            
        else:
            return jsonify({"error": "Only one-sample t-test implemented"}), 400
            
    except Exception as e:
        logger.error(f"T-test error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/descriptive-stats', methods=['POST'])
def descriptive_stats():
    """
    Calculate comprehensive descriptive statistics
    Input: {"data": [1,2,3,4,5]}
    Output: {"mean": 3.0, "std": 1.58, "sem": 0.71, "ci_95": [1.2, 4.8], ...}
    """
    try:
        data = request.json.get('data')
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        data_array = np.array(data, dtype=float)
        n = len(data_array)
        
        # Basic statistics
        mean_val = float(np.mean(data_array))
        std_val = float(np.std(data_array, ddof=1))
        sem_val = float(stats.sem(data_array))
        
        # Confidence interval (95%)
        ci_95 = stats.t.interval(0.95, n-1, loc=mean_val, scale=sem_val)
        
        # Additional statistics
        median_val = float(np.median(data_array))
        q25, q75 = np.percentile(data_array, [25, 75])
        iqr = q75 - q25
        
        return jsonify({
            "n": n,
            "mean": mean_val,
            "median": median_val,
            "std": std_val,
            "sem": sem_val,
            "variance": float(np.var(data_array, ddof=1)),
            "min": float(np.min(data_array)),
            "max": float(np.max(data_array)),
            "q25": float(q25),
            "q75": float(q75),
            "iqr": float(iqr),
            "ci_95_lower": float(ci_95[0]),
            "ci_95_upper": float(ci_95[1]),
            "skewness": float(stats.skew(data_array)),
            "kurtosis": float(stats.kurtosis(data_array))
        })
        
    except Exception as e:
        logger.error(f"Descriptive stats error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/envelope-analysis', methods=['POST'])
def envelope_analysis():
    """
    Complete envelope model statistical analysis
    Input: {"envelope_data": [...], "baseline_mu": 0.0}
    Output: {"descriptive": {...}, "normality": {...}, "t_test": {...}}
    """
    try:
        envelope_data = request.json.get('envelope_data')
        baseline_mu = request.json.get('baseline_mu', 0.0)
        
        if not envelope_data or len(envelope_data) < 3:
            return jsonify({"error": "Envelope analysis requires at least 3 data points"}), 400
        
        data_array = np.array(envelope_data, dtype=float)
        
        # Call internal functions to get results
        desc_result = get_descriptive_stats(envelope_data)
        shapiro_result = get_shapiro_wilk(envelope_data)
        t_result = get_t_test(envelope_data, baseline_mu)
        
        logger.info(f"Envelope analysis: n={len(envelope_data)}, normal={shapiro_result.get('is_normal')}, significant={t_result.get('significant')}")
        
        return jsonify({
            "descriptive": desc_result,
            "normality": shapiro_result,
            "t_test": t_result,
            "recommendation": {
                "use_parametric": shapiro_result.get('is_normal', False),
                "effect_size": abs(desc_result.get('mean', 0) - baseline_mu) / desc_result.get('std', 1)
            }
        })
        
    except Exception as e:
        logger.error(f"Envelope analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Helper functions for envelope analysis
def get_descriptive_stats(data):
    """Internal helper for descriptive stats"""
    data_array = np.array(data, dtype=float)
    n = len(data_array)
    mean_val = float(np.mean(data_array))
    std_val = float(np.std(data_array, ddof=1))
    sem_val = float(stats.sem(data_array))
    ci_95 = stats.t.interval(0.95, n-1, loc=mean_val, scale=sem_val)
    median_val = float(np.median(data_array))
    q25, q75 = np.percentile(data_array, [25, 75])
    
    return {
        "n": n,
        "mean": mean_val,
        "median": median_val,
        "std": std_val,
        "sem": sem_val,
        "variance": float(np.var(data_array, ddof=1)),
        "min": float(np.min(data_array)),
        "max": float(np.max(data_array)),
        "q25": float(q25),
        "q75": float(q75),
        "iqr": float(q75 - q25),
        "ci_95_lower": float(ci_95[0]),
        "ci_95_upper": float(ci_95[1]),
        "skewness": float(stats.skew(data_array)),
        "kurtosis": float(stats.kurtosis(data_array))
    }

def get_shapiro_wilk(data):
    """Internal helper for Shapiro-Wilk test"""
    data_array = np.array(data, dtype=float)
    statistic, p_value = stats.shapiro(data_array)
    return {
        "statistic": float(statistic),
        "p_value": float(p_value),
        "is_normal": p_value > 0.05,
        "alpha": 0.05,
        "interpretation": "normal" if p_value > 0.05 else "non-normal"
    }

def get_t_test(data, mu0):
    """Internal helper for t-test"""
    data_array = np.array(data, dtype=float)
    statistic, p_value = stats.ttest_1samp(data_array, mu0)
    return {
        "test_type": "one-sample",
        "statistic": float(statistic),
        "p_value": float(p_value),
        "mu0": mu0,
        "sample_mean": float(np.mean(data_array)),
        "sample_std": float(np.std(data_array, ddof=1)),
        "significant": p_value < 0.05,
        "alpha": 0.05
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port) 