import { useState } from 'react';
import { TestTube, CheckCircle, XCircle, ExternalLink, Play, Code } from 'lucide-react';

export default function TestTracking() {
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [utmParams, setUtmParams] = useState({
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'test_campaign',
    utm_term: '',
    utm_content: ''
  });
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const buildTestUrl = () => {
    const params = new URLSearchParams();
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return queryString ? `${testUrl}?${queryString}` : testUrl;
  };

  const runTest = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      // Simulate tracking event
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const trackingData = {
        event_name: 'page_view',
        client_id: `test_${Date.now()}`,
        session_id: `session_${Date.now()}`,
        page_url: buildTestUrl(),
        page_title: 'Test Page - Beacon Tracking',
        page_referrer: document.referrer || 'direct',
        ...utmParams,
        timestamp: Date.now()
      };

      const response = await fetch(`${API_URL}/api/track/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        setTestResults({
          success: true,
          message: 'Tracking event sent successfully!',
          data: trackingData
        });
      } else {
        const error = await response.json();
        setTestResults({
          success: false,
          message: error.message || 'Failed to send tracking event',
          error
        });
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Error connecting to tracking API',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const copyScriptSnippet = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const snippet = `<script>
  (function() {
    window.beaconConfig = {
      apiEndpoint: '${API_URL}',
      siteId: 'your-site-id-here',
      debug: true
    };
    var script = document.createElement('script');
    script.src = '${API_URL}/beacon.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
    
    navigator.clipboard.writeText(snippet);
    alert('Script snippet copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full" style={{ backgroundColor: '#46B64620' }}>
            <TestTube className="w-6 h-6" style={{ color: '#46B646' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Tracking</h1>
            <p className="mt-2 text-gray-600">
              Test your tracking setup with custom UTM parameters before installing on your site
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Play className="w-5 h-5 mr-2" style={{ color: '#46B646' }} />
            Configure Test
          </h2>

          <div className="space-y-4">
            {/* Test URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test URL
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': '#46B646' }}
                placeholder="https://example.com"
              />
            </div>

            {/* UTM Parameters */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">UTM Parameters</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Source (required)
                  </label>
                  <input
                    type="text"
                    value={utmParams.utm_source}
                    onChange={(e) => setUtmParams({ ...utmParams, utm_source: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="google"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium (required)
                  </label>
                  <input
                    type="text"
                    value={utmParams.utm_medium}
                    onChange={(e) => setUtmParams({ ...utmParams, utm_medium: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="cpc"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Campaign (required)
                  </label>
                  <input
                    type="text"
                    value={utmParams.utm_campaign}
                    onChange={(e) => setUtmParams({ ...utmParams, utm_campaign: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="spring_sale"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Term (optional)
                  </label>
                  <input
                    type="text"
                    value={utmParams.utm_term}
                    onChange={(e) => setUtmParams({ ...utmParams, utm_term: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="keyword"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Content (optional)
                  </label>
                  <input
                    type="text"
                    value={utmParams.utm_content}
                    onChange={(e) => setUtmParams({ ...utmParams, utm_content: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="banner_ad"
                  />
                </div>
              </div>
            </div>

            {/* Generated URL Preview */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Test URL:
              </label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 break-all text-sm text-gray-700">
                {buildTestUrl()}
              </div>
            </div>

            {/* Run Test Button */}
            <button
              onClick={runTest}
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? '#ccc' : '#46B646' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Test Results */}
          {testResults && (
            <div className={`bg-white rounded-lg shadow-md border-2 p-6 ${
              testResults.success ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-start gap-3">
                {testResults.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    testResults.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResults.success ? 'Test Successful!' : 'Test Failed'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{testResults.message}</p>
                  
                  {testResults.success && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        ✅ Event captured successfully<br />
                        ✅ UTM parameters recorded<br />
                        ✅ Ready to view in dashboard
                      </p>
                      <a
                        href="/visitors"
                        className="inline-flex items-center gap-2 text-sm font-medium mt-3"
                        style={{ color: '#46B646' }}
                      >
                        View in Visitors
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {testResults.error && (
                    <div className="mt-3 bg-red-50 p-3 rounded text-xs text-red-700 font-mono">
                      {JSON.stringify(testResults.error, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Installation Instructions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Code className="w-5 h-5 mr-2" style={{ color: '#00A9BA' }} />
              Installation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Once your test is successful, copy this script snippet and paste it in your website's <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;head&gt;</code> tag:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto mb-3">
              <pre>{`<script>
  (function() {
    window.beaconConfig = {
      apiEndpoint: '${import.meta.env.VITE_API_URL || 'http://localhost:3000'}',
      siteId: 'your-site-id-here',
      debug: false
    };
    var script = document.createElement('script');
    script.src = window.beaconConfig.apiEndpoint + '/beacon.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`}</pre>
            </div>
            <button
              onClick={copyScriptSnippet}
              className="w-full py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#00A9BA' }}
            >
              Copy Script to Clipboard
            </button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Testing Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use different UTM parameters to test traffic source tracking</li>
              <li>• Check the Visitors page to see your test data appear</li>
              <li>• Test events appear immediately in the dashboard</li>
              <li>• Use the Overview page to see aggregate metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
