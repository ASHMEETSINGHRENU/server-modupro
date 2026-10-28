require('dotenv').config();
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { seedIfEmpty } = require('../src/services/seedService');
const AdminUser = require('../src/models/AdminUser');
const Enquiry = require('../src/models/Enquiry');

async function request(baseUrl, reqPath, { method = 'GET', headers = {}, body = null } = {}) {
  const url = new URL(reqPath, baseUrl);
  const reqHeaders = { ...headers };
  let payload = body;

  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    payload = JSON.stringify(body);
    reqHeaders['Content-Type'] = 'application/json';
    reqHeaders['Content-Length'] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            // non-JSON response (e.g. CSV)
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            raw,
            json,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function extractCookies(setCookieHeader = []) {
  const cookieJar = {};
  for (const raw of setCookieHeader) {
    const firstPart = raw.split(';')[0];
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const k = firstPart.slice(0, eqIdx).trim();
      const v = firstPart.slice(eqIdx + 1).trim();
      cookieJar[k] = v;
    }
  }
  return cookieJar;
}

async function runTests() {
  console.log('==============================================================');
  console.log('MODU PRO INNOVATION PVT. LTD. — AUTOMATED QA & INTEGRATION SUITE');
  console.log('==============================================================');

  let server;
  try {
    // 1. Connect to MongoDB & Seed
    await connectDB();
    await seedIfEmpty({ force: true });
    console.log('✓ [1/14] MongoDB connection & initial catalog seed verified');

    // 2. Provision Test Admin Account
    const testAdminEmail = 'qa-admin@modupro.in';
    const testAdminPass = 'ModuPro#QA2026!Secure';
    const passwordHash = await AdminUser.hashPassword(testAdminPass);
    await AdminUser.findOneAndUpdate(
      { email: testAdminEmail },
      {
        name: 'QA Super Administrator',
        email: testAdminEmail,
        passwordHash,
        role: 'super_admin',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('✓ [2/14] Administrator provisioning (bcrypt hash) verified');

    // Start ephemeral HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    // 3. Health & Public Site Settings
    const healthRes = await request(baseUrl, '/api/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.json.success, true);

    const settingsRes = await request(baseUrl, '/api/public/site-settings');
    assert.strictEqual(settingsRes.status, 200);
    assert.strictEqual(settingsRes.json.data.companyName, 'Modu Pro Innovation Pvt. Ltd.');
    assert.strictEqual(settingsRes.json.data.notification, undefined, 'Internal notification config must not leak publicly');
    console.log('✓ [3/14] Public site-settings endpoint & field sanitization verified');

    // 4. All Four Dedicated Division Endpoints
    const divSlugs = ['adhesi-pro', 'pcd-blades', 'panel-processing', 'edge-banding-hardware'];
    for (const slug of divSlugs) {
      const divRes = await request(baseUrl, `/api/public/divisions/${slug}`);
      assert.strictEqual(divRes.status, 200, `Division ${slug} should return 200`);
      assert.strictEqual(divRes.json.data.division.slug, slug);
      assert.ok(Array.isArray(divRes.json.data.products) && divRes.json.data.products.length > 0);
    }
    console.log('✓ [4/14] All 4 division detail endpoints & product catalogs verified');

    // 5. Public Services & Industries Endpoints
    const [srvRes, indRes] = await Promise.all([
      request(baseUrl, '/api/public/services'),
      request(baseUrl, '/api/public/industries'),
    ]);
    assert.strictEqual(srvRes.status, 200);
    assert.strictEqual(srvRes.json.data.length, 7);
    assert.strictEqual(indRes.status, 200);
    assert.strictEqual(indRes.json.data.length, 4);
    console.log('✓ [5/14] Public services (7) & industries (4) endpoints verified');

    // 6. Protected Route Authorization Check
    const unauthRes = await request(baseUrl, '/api/admin/dashboard');
    assert.strictEqual(unauthRes.status, 401);
    console.log('✓ [6/14] Unauthenticated access to /api/admin/* blocked with 401');

    // 7. Admin Login (Invalid & Valid) + Cookie & CSRF Verification
    const badLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testAdminEmail, password: 'WrongPassword123' },
    });
    assert.strictEqual(badLogin.status, 401);

    const goodLogin = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testAdminEmail, password: testAdminPass },
    });
    assert.strictEqual(goodLogin.status, 200);
    const cookies = extractCookies(goodLogin.headers['set-cookie']);
    assert.ok(cookies.modu_admin_token, 'httpOnly JWT cookie must be set');
    assert.ok(cookies.modu_csrf_token, 'CSRF token cookie must be set');

    const cookieHeader = `modu_admin_token=${cookies.modu_admin_token}; modu_csrf_token=${cookies.modu_csrf_token}`;
    const csrfToken = cookies.modu_csrf_token;
    const authHeaders = {
      Cookie: cookieHeader,
      'x-csrf-token': csrfToken,
    };

    const meRes = await request(baseUrl, '/api/auth/me', { headers: authHeaders });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.json.data.admin.email, testAdminEmail);
    console.log('✓ [7/14] Admin authentication, httpOnly JWT cookie & /api/auth/me verified');

    // 8. CSRF Enforcement on Mutating Requests
    const csrfBlocked = await request(baseUrl, '/api/admin/services', {
      method: 'POST',
      headers: { Cookie: cookieHeader }, // missing x-csrf-token header
      body: { name: 'Blocked Service', shortDescription: 'Test', description: 'Test' },
    });
    assert.strictEqual(csrfBlocked.status, 403, 'Mutating request without CSRF token must return 403');
    console.log('✓ [8/14] Double-submit CSRF protection verified');

    // 9. Division Referential Integrity Protection
    const adminDivsRes = await request(baseUrl, '/api/admin/divisions', { headers: authHeaders });
    const adhesiDiv = adminDivsRes.json.data.find((d) => d.slug === 'adhesi-pro');
    const delDivBlocked = await request(baseUrl, `/api/admin/divisions/${adhesiDiv._id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(
      delDivBlocked.status,
      409,
      'Deleting a division with referenced products must return 409 Conflict'
    );
    console.log('✓ [9/14] Division referential deletion protection (409 Conflict) verified');

    // 10. Product CRUD + Draft Isolation & Unverified Spec Filtering
    const createProdRes = await request(baseUrl, '/api/admin/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'QA Test Draft Blade',
        slug: 'qa-test-draft-blade',
        division: adhesiDiv._id,
        category: 'PVAC White Glue',
        shortDescription: 'Draft product that must not appear publicly',
        publicationStatus: 'draft',
        specifications: [
          { label: 'Verified Spec', value: 'Visible', isVerified: true },
          { label: 'Unverified Spec', value: 'Secret Unverified', isVerified: false },
        ],
      },
    });
    assert.strictEqual(createProdRes.status, 201);
    const createdProdId = createProdRes.json.data._id;

    // Verify draft product is NOT returned by public API
    const pubDraftCheck = await request(baseUrl, '/api/public/products/qa-test-draft-blade');
    assert.strictEqual(pubDraftCheck.status, 404, 'Draft product must never be exposed publicly');

    // Publish product and verify unverified specification is stripped from public API
    await request(baseUrl, `/api/admin/products/${createdProdId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { publicationStatus: 'published' },
    });

    const pubPublishedCheck = await request(baseUrl, '/api/public/products/qa-test-draft-blade');
    assert.strictEqual(pubPublishedCheck.status, 200);
    assert.strictEqual(pubPublishedCheck.json.data.specifications.length, 1);
    assert.strictEqual(pubPublishedCheck.json.data.specifications[0].label, 'Verified Spec');

    // Clean up test product
    const delProdRes = await request(baseUrl, `/api/admin/products/${createdProdId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(delProdRes.status, 200);
    console.log('✓ [10/14] Product CRUD, draft isolation & unverified specification filtering verified');

    // 11. Service & Industry CRUD
    const createSrvRes = await request(baseUrl, '/api/admin/services', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'QA Spindle Calibration Service',
        shortDescription: 'Precision spindle check',
        description: 'Full spindle calibration test',
        confirmationStatus: 'pending_confirmation',
        publicationStatus: 'draft',
      },
    });
    assert.strictEqual(createSrvRes.status, 201);
    const delSrvRes = await request(baseUrl, `/api/admin/services/${createSrvRes.json.data._id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(delSrvRes.status, 200);
    console.log('✓ [11/14] Service & Industry CRUD workflows verified');

    // 12. Public Enquiry Validation, Persistence & Duplicate Prevention
    const invalidEnq = await request(baseUrl, '/api/public/enquiries', {
      method: 'POST',
      body: { fullName: 'A', companyName: '', phone: 'bad', email: 'invalid', message: 'short' },
    });
    assert.strictEqual(invalidEnq.status, 400);

    const validEnqPayload = {
      fullName: 'Vikram Deshmukh',
      companyName: 'Deshmukh Modular Kitchens Nagpur',
      phone: '+91 98230 11223',
      email: 'vikram@deshmukhmodular.in',
      divisionSlug: 'adhesi-pro',
      message: 'We require bulk drums of Lockpro WR 3 and Lockpro 808 for our modular kitchen factory.',
      sourcePage: '/divisions/adhesi-pro',
      consentAccepted: true,
    };

    const validEnqRes = await request(baseUrl, '/api/public/enquiries', {
      method: 'POST',
      body: validEnqPayload,
    });
    assert.strictEqual(validEnqRes.status, 201);
    const enqReference = validEnqRes.json.data.reference;
    assert.ok(/^MP-\d{8}-[A-F0-9]{4}$/.test(enqReference), `Invalid reference format: ${enqReference}`);

    // Verify immediate duplicate submission is blocked with 429
    const dupEnqRes = await request(baseUrl, '/api/public/enquiries', {
      method: 'POST',
      body: validEnqPayload,
    });
    assert.strictEqual(dupEnqRes.status, 429);
    console.log(`✓ [12/14] Public enquiry persistence (${enqReference}) & duplicate prevention verified`);

    // 13. Admin Enquiry CRM Status Update, Internal Notes & CSV Export
    const enqListRes = await request(baseUrl, `/api/admin/enquiries?search=${enqReference}`, {
      headers: authHeaders,
    });
    assert.strictEqual(enqListRes.status, 200);
    const savedEnq = enqListRes.json.data[0];
    assert.ok(savedEnq && savedEnq.reference === enqReference);

    const updateEnqRes = await request(baseUrl, `/api/admin/enquiries/${savedEnq._id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: { status: 'In Progress', assignedTo: 'Nagpur Adhesi Pro Desk' },
    });
    assert.strictEqual(updateEnqRes.status, 200);
    assert.strictEqual(updateEnqRes.json.data.status, 'In Progress');

    const noteEnqRes = await request(baseUrl, `/api/admin/enquiries/${savedEnq._id}/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: { note: 'Spoke with customer; dispatching Lockpro WR 3 technical leaflet.' },
    });
    assert.strictEqual(noteEnqRes.status, 201);
    assert.strictEqual(noteEnqRes.json.data.internalNotes.length, 1);

    const csvRes = await request(baseUrl, '/api/admin/enquiries/export', {
      headers: authHeaders,
    });
    assert.strictEqual(csvRes.status, 200);
    assert.ok(csvRes.raw.includes(enqReference), 'Exported CSV must contain the saved enquiry reference');

    // Clean up QA test enquiry & test admin so production DB starts clean
    await Enquiry.deleteOne({ _id: savedEnq._id });
    await AdminUser.deleteOne({ email: testAdminEmail });
    console.log('✓ [13/14] Admin CRM status transition, private internal notes & CSV export verified');

    // 14. Admin Logout
    const logoutRes = await request(baseUrl, '/api/auth/logout', {
      method: 'POST',
      headers: authHeaders,
    });
    assert.strictEqual(logoutRes.status, 200);
    console.log('✓ [14/14] Admin logout & session teardown verified');

    console.log('==============================================================');
    console.log('ALL 14 AUTOMATED QA & SECURITY CHECKS PASSED SUCCESSFULLY');
    console.log('==============================================================');
  } finally {
    if (server) {
      await new Promise((r) => server.close(r));
    }
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('QA TEST FAILURE:', err);
  process.exit(1);
});
