
function handleMessage(event)
{
	console.log("received ", event.data);
	if (event.data.search("workerID") != -1)
	{
		var workerID = parseInt(event.data[9])
		this['workerID'] = workerID;
	}
	else
	{
		console.log("worker " +String(this) + " id:" +String(self.workID) + " starts job");

        // decode job function and execute
		var job = JSON.parse(event.data);
		var evalString = "func = " +job.func;
		eval(evalString);
		func(job.funcData);
	}

	self.postMessage(this.workerID.toString());
}

self.addEventListener("message", handleMessage, false);

