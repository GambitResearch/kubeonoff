import sum from 'lodash/sum'

/*
Status calculation that mimics kubectl is a bastard to do. This is ported in a hurry from the Go source linked below
https://github.com/kubernetes/kubernetes/blob/8823a835655cfcf73ddf8a636e2e11f83baeea57/pkg/printers/internalversion/printers.go#L523
*/
export const computePodStatus = pod => {
	let reason = pod.status.phase

	if ( pod.status.reason ) {
		reason = pod.status.reason
	}

	// Here we ignore "Init Containers" in their entirity because we don't use them at Gambit. Sorry

	// TODO: INSERT INIT CONTAINER CODE HERE

	const containerStatuses = pod.status.containerStatuses || []

	containerStatuses.reverse()
	containerStatuses.forEach( container => {
		const {
			state = {}
		} = container

		if ( state.waiting && state.waiting.reason ) {
			reason = state.waiting.reason
		} else if ( state.terminated && state.terminated.reason ) {
			reason = state.terminated.reason
		} else if ( state.terminated && state.terminated.hasOwnProperty( 'reason' ) ) {
			if ( state.terminated.sigal !== 0 ) {
				reason = `Signal: ${state.terminated.signal}`
			} else {
				reason = `ExitCode: ${state.terminated.exitCode}`
			}
		}
	} )

	if ( pod.metadata.deletionTimestamp && pod.status.reason && pod.status.reason.toLowerCase() === 'nodelost' ) {
		reason = 'Unknown'
	} else if ( pod.metadata.deletionTimestamp ) {
		reason = 'Terminating'
	}

	return reason
}

/*
This is also lifted from
https://github.com/kubernetes/kubernetes/blob/8823a835655cfcf73ddf8a636e2e11f83baeea57/pkg/printers/internalversion/printers.go#L523
*/
export const computePodRestarts = pod => {
	// Here we ignore "Init Containers" in their entirity because we don't use them at Gambit. Sorry

	// TODO: INSERT INIT CONTAINER CODE HERE

	const containerStatuses = pod.status.containerStatuses || []

	const restarts = sum( containerStatuses
		.map( ( {
				restartCount = 0
			} ) => restartCount ) )

	return restarts
}


export const computeDeploymentState = deployment => {
	const {
		spec,
		status
	} = deployment

	if ( !spec.replicas ) {
		return 'off'
	} else if ( status.availableReplicas === spec.replicas ) {
		return 'on'
	} else {
		return 'pending'
	}
}


export const computeDaemonsetState = daemonset => {
	const {
		status
	} = daemonset

	if ( status.desiredNumberScheduled === status.numberAvailable ) {
		return 'on'
	} else {
		return 'pending'
	}
}


export const isImportantDeployment = deployment => !!(deployment.metadata.annotations || {})[ 'kubeonoff/important' ]


export const isImportantPod = pod => (pod.metadata.labels || {})[ 'kubeonoff-important' ]


export const formatTimeAgo = milliseconds => {
	const seconds = milliseconds / 1000
	const minutes = seconds / 60
	const hours = minutes / 60
	const days = hours / 24

	if ( milliseconds < 1000 ) {
		return `${milliseconds | 0}ms`
	} else if ( seconds < 60 ) {
		return `${seconds | 0}s`
	} else if ( minutes < 60 ) {
		return `${minutes | 0}m`
	} else if ( hours < 24 ) {
		return `${hours | 0}h`
	} else {
		return `${days | 0}d`
	}
}


export const computeMinumumUptime = pod => {
	const uptimes = (pod.status.containerStatuses || [])
		.map( container => {
			const running = container.state.running
			return running && running.startedAt ?new Date() - new Date( running.startedAt ): 0
		} )

	if ( !uptimes.length )
		return 0

	return Math.min( ...uptimes )
}


export const computeMaxMetrics = pods => {
	let maxCpu = null;
	let maxMem = null;
	pods.forEach(pod => {
		if (!pod.metrics)
			return;
		Object.values(pod.metrics).forEach(metrics => {
			if (maxCpu === null || metrics.cpu_ratio > maxCpu)
				maxCpu = metrics.cpu_ratio
			if (maxMem === null || metrics.mem_ratio > maxMem)
				maxMem = metrics.mem_ratio
		})
	})
	return {cpu: maxCpu, mem: maxMem}
}
