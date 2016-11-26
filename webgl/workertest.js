var test = 0;
function testWorker()
{
	workers =[];
	for (var i = 0; i < 2; i++)
	{
		var worker = new Worker("worker.js");
		workers.push(worker);
		worker.addEventListener("message",
			function (event)
			{
			    if (test <= 0)
			    {
			        var id = parseInt(event.data);
			        var workerID = "worker";
			        
                    // convert to json string (need importScripts() for any additional library needed)
			        var jobJSON = JSON.stringify({ func: "function loadModel(data){importScripts(\"modelloader.js\");var modelLoader = new ModelLoader(data);}", funcData: "altair.obj" });
			        worker.postMessage(jobJSON);

			        console.log("worker " + id.toString() + " returned: " + event.data);
			    }

				++test;
			},
			false);

			// kick off worker, giving its ID
		    worker.postMessage("workerID " +String(i));
	}
}