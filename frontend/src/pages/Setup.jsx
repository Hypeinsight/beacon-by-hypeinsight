import { useState } from 'react';
import { Settings, Copy, CheckCircle, Code, ExternalLink, Wrench } from 'lucide-react';

export default function Setup() {
  const [copied, setCopied] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const scriptSnippet = `<script>
(function() {
  window.beaconConfig = {
    endpoint: '${API_URL}/api/track',
    batchEndpoint: '${API_URL}/api/track/batch'
  };
  
  var script = document.createElement('script');
  script.src = '${API_URL}/beacon-dev.js?v=2.4.0&t=' + Date.now();
  script.async = true;
  script.onload = function() {
    if (window.beacon) {
      beacon('init', 'YOUR_SITE_ID');
    }
  };
  document.head.appendChild(script);
})();
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full" style={{ backgroundColor: '#00A9BA20' }}>
            <Settings className="w-6 h-6" style={{ color: '#00A9BA' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Setup & Installation</h1>
            <p className="mt-2 text-gray-600">
              Get started with Beacon tracking in just 2 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-br from-green-50 to-cyan-50 border-2 rounded-lg p-6" style={{ borderColor: '#46B646' }}>
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#46B646' }}>
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Start</h2>
            <ol className="space-y-2 text-gray-700">
              <li>1. Copy the tracking script below</li>
              <li>2. Paste it in your website's <code className="bg-white px-2 py-0.5 rounded">&lt;head&gt;</code> section</li>
              <li>3. Deploy your changes</li>
              <li>4. Start seeing data in your dashboard!</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Installation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Script Snippet */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Code className="w-5 h-5 mr-2" style={{ color: '#46B646' }} />
                Tracking Script
              </h3>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: copied ? '#46B646' : '#00A9BA' }}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Script
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{scriptSnippet}</pre>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Place this script in the <code className="bg-yellow-100 px-1 rounded">&lt;head&gt;</code> section of your HTML, before the closing <code className="bg-yellow-100 px-1 rounded">&lt;/head&gt;</code> tag, to ensure tracking starts as soon as the page loads.
              </p>
            </div>
          </div>

          {/* Installation Examples */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform-Specific Instructions</h3>
            
            <div className="space-y-4">
              {/* WordPress */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">WordPress</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>Appearance → Theme Editor</strong></li>
                  <li>Select <strong>header.php</strong> from the right sidebar</li>
                  <li>Paste the script before <code className="bg-gray-100 px-1 rounded">&lt;/head&gt;</code></li>
                  <li>Click <strong>Update File</strong></li>
                </ol>
              </div>

              {/* Shopify */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Shopify</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>Online Store → Themes</strong></li>
                  <li>Click <strong>Actions → Edit code</strong></li>
                  <li>Open <strong>theme.liquid</strong></li>
                  <li>Paste the script before <code className="bg-gray-100 px-1 rounded">&lt;/head&gt;</code></li>
                  <li>Click <strong>Save</strong></li>
                </ol>
              </div>

              {/* HTML/Custom Sites */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">HTML / Custom Sites</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Open your <code className="bg-gray-100 px-1 rounded">index.html</code> or template file</li>
                  <li>Paste the script in the <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section</li>
                  <li>Save and deploy your changes</li>
                </ol>
              </div>

              {/* React/Next.js */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">React / Next.js</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>For React: Add to <code className="bg-gray-100 px-1 rounded">public/index.html</code></li>
                  <li>For Next.js: Add to <code className="bg-gray-100 px-1 rounded">_document.js</code> in the <code className="bg-gray-100 px-1 rounded">&lt;Head&gt;</code> component</li>
                  <li>Rebuild and redeploy</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* DataLayer Events */}
          <div className="bg-white rounded-lg shadow-md border-2 p-6" style={{ borderColor: '#00A9BA' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" style={{ color: '#00A9BA' }} />
              DataLayer Tracking
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Beacon automatically captures ALL dataLayer events from Google Tag Manager, Shopify, and other platforms. No additional configuration needed!
            </p>
            <div className="text-xs text-gray-600">
              <strong>Supported:</strong> E-commerce (add_to_cart, purchase), Form submissions, Custom events
            </div>
          </div>

          {/* What Gets Tracked */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What Gets Tracked</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">📄</span>
                <span><strong>Page Views:</strong> Every page your visitors view</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🖱️</span>
                <span><strong>Clicks:</strong> Button and link interactions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📜</span>
                <span><strong>Scroll Depth:</strong> How far users scroll</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🛒</span>
                <span><strong>E-commerce:</strong> Add to cart, purchases (via dataLayer)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <span><strong>DataLayer Events:</strong> All GTM/custom events automatically</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌍</span>
                <span><strong>Location:</strong> City, country, company (B2B)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📱</span>
                <span><strong>Device:</strong> Browser, OS, screen size</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔗</span>
                <span><strong>Traffic Source:</strong> UTM parameters, referrers</span>
              </li>
            </ul>
          </div>

          {/* Privacy & Compliance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">🔒 Privacy & Data</h4>
            <p className="text-xs text-blue-800">
              Beacon uses server-side tracking with first-party data collection. The system is designed for privacy-first architecture. Full GDPR/CCPA compliance features are in development.
            </p>
          </div>

          {/* Support */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-xs text-gray-700 mb-3">
              Having trouble with installation? Check our documentation or contact support.
            </p>
            <a
              href="mailto:support@hypeinsight.com"
              className="text-xs font-medium"
              style={{ color: '#00A9BA' }}
            >
              Contact Support →
            </a>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">Install Script</h4>
            <p className="text-sm text-gray-600">Add the tracking script to your website's head section</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">Visit Your Site</h4>
            <p className="text-sm text-gray-600">Open your website in a browser to trigger tracking</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-semibold text-gray-900 mb-1">Check Dashboard</h4>
            <p className="text-sm text-gray-600">Go to <a href="/visitors" className="font-medium" style={{ color: '#46B646' }}>Visitors</a> to see your data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
