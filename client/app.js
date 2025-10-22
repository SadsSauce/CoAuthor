document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('signup-form');
	const googleBtn = document.getElementById('signup-google');

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const name = document.getElementById('name').value.trim();
		const email = document.getElementById('email').value.trim();
		const password = document.getElementById('password').value;

		// Simple client-side validation
		if (!name || !email || password.length < 6) {
			alert('Please provide a name, a valid email, and a password of at least 6 characters.');
			return;
		}

		// Mock submit — replace with real API call to server when ready
		console.log('Signing up', { name, email });
		alert('Sign-up submitted (mock). Check console for payload.');
		form.reset();
	});

	googleBtn.addEventListener('click', () => {
		// In a real app, redirect to OAuth endpoint. Here we show a placeholder.
		console.log('Sign up with Google clicked');
		alert('This would start the Google OAuth flow (placeholder).');
	});
});
