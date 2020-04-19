self.addEventListener('push', async event => {
	// if (self.clientId) {
	// 	const client = await self.clients.get(self.clientId);
	// 	let data = event.data.json();
	// 	client.postMessage( { updated: true, clientId: data.clientId });
	// }

	let data = event.data.json();
	let clients = await self.clients.matchAll();
	clients.forEach(x => {
			x.postMessage( { updated: true, clientId: data.clientId });
	});

	console.log("ServiceWorker - push");
});

self.addEventListener('fetch', async event => {
	// if (event.clientId) {
	// 	self.clientId = event.clientId;
	// }
	// console.log("hello im here fetch");
	console.log("fetch");
});