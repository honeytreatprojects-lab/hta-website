/*!
 * brevo-enroll.js — sends each course enrolment to Brevo (via enroll-brevo.php) so the
 * student receives the automated emails from Automation #2.
 * Works alongside the existing EmailJS code on courses.html without changing it:
 * it simply listens for the same form submit.
 * Include on courses.html only:  <script src="brevo-enroll.js" defer></script>
 */
(function () {
  'use strict';
  var ENDPOINT = 'enroll-brevo.php';

  function start() {
    var form = document.getElementById('enrollForm');
    if (!form || form.__htaBrevo) return;
    form.__htaBrevo = true;

    form.addEventListener('submit', function () {
      // Runs right after the page's own submitEnrollForm(); values are read before it resets the form.
      var f = form.elements;
      var get = function (name) { return f[name] ? String(f[name].value || '').trim() : ''; };
      var payload = {
        firstName: get('firstName'),
        lastName: get('lastName'),
        email: get('email'),
        phone: get('phone'),
        message: get('message'),
        course: get('course'),
        centre: get('centre'),
        page: location.pathname
      };
      if (!payload.email || !payload.firstName) return;

      try {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
          credentials: 'same-origin'
        }).catch(function () { /* never block or alter the enrolment UI */ });
      } catch (e) { /* older browsers: ignore */ }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
