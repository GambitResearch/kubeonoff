import React from 'react'
import './Pod.css'

import { deletePod } from '../lib/api'
import { computeMinumumUptime, formatTimeAgo, computePodStatus, computePodRestarts } from '../lib/utils'

import PodLogs from './PodLogs'

const _containerNameWithRestarts = ( {
		name,
		restartCount = 0
	} ) => restartCount ?
	`${name} (Restarts: ${restartCount})` :
	name

const PodContainersReadyBreakdown = ( {
		containerStatuses = []
	} ) => {

	const ready = []
	const unready = []

	containerStatuses.forEach( container => {
		if ( container.ready ) {
			ready.push( container )
		} else {
			unready.push( container )
		}
	} )

	const readyItems = ready.length ? ready.map( container => (
		<div
			className='pod-containers-ready-breakdown-container-ready'
			key={ container.name }>
			{ _containerNameWithRestarts( container ) }
		</div>
	) ): null

	const unreadyItems = unready.length ? unready.map( container => (
		<div
			className='pod-containers-ready-breakdown-container-unready'
			key={ container.name }>
			{ _containerNameWithRestarts( container ) }
		</div>
	) ): null

	return (
		<div className='pod-containers-ready-breakdown'>
			{ readyItems ? 'Ready:' : '' }
			<div className='pod-containers-ready-breakdown-containers'>
				{ readyItems }
			</div>
			{ unreadyItems ? 'Not Ready:' : '' }
			<div className='pod-containers-ready-breakdown-containers'>
				{ unreadyItems }
			</div>
		</div>
	)
}

const PodContainers = ( {
		pod
	} ) => {

	const containerStatuses = pod.status.containerStatuses || []

	const allReady = containerStatuses.every( ( {
			ready
		} ) => ready )

	return (
		<div className='pod-containers'>
			{ !allReady? <PodContainersReadyBreakdown containerStatuses={ containerStatuses } /> : null }
		</div>
	)
}


class Pod extends React.Component {

	state = {
		logsEnabled: false
	}

	onDeleteClick = async () => {
		const {
			pod
		} = this.props
		const result = await deletePod( pod.metadata.name )
		console.log( result )
	}

	onLogsClick = () => {
		this.setState( {
			logsEnabled: true
		} )
	}

	render() {

		const {
			pod,
			showNodeName = true
		} = this.props

		const {
			logsEnabled
		} = this.state

		const logs = logsEnabled ? <PodLogs pod={ pod } /> : null

		const uptime = computeMinumumUptime( pod )
		const restarts = computePodRestarts( pod )

		let ready = false

		if ( 'containerStatuses' in pod.status ) {
			ready = pod.status.containerStatuses.every( ( {
					ready
				} ) => ready )
		}

		let status = computePodStatus( pod )

		if ( status === 'Running' && !ready ) {
			status = 'NotReady'
		}


		const restartsSection = restarts ? (
			<div className='pod-restarts'>
				{ `Restarts: ${restarts}` }
			</div>
			) : null

		var metricsSection = null
		if (pod.metrics) {
		   	const items = []
		   	Object.entries(pod.metrics).forEach(entry => {
		   		  const [container_name, metrics] = entry
		   		  console.log(container_name, metrics)
	                items.push(<div>
	                   <p>[{container_name}] CPU: {Math.round(metrics.cpu_ratio * 100)}%;
	                   Mem: {Math.round(metrics.mem_ratio * 100)}%</p>
	                </div>)
       		})
			metricsSection = (
				<div className='pod-metrics'>
				   {
	           		  items
	           	   }
				</div>
			)
		}
		return (
			<div
				className='pod'
				data-pod-status={ status }
				data-pod-ready={ ready }>
				<div className='pod-header'>
					<div className='pod-name'>
						{ `${pod.metadata.name}${showNodeName?`@${pod.spec.nodeName}`:''} (${status}${uptime ? `, ${formatTimeAgo(uptime)}` : ''})` }
					</div>
					<div
						className='action-button pod-button-logs'
						style={ { display: logsEnabled ? 'none' : '' } }
						onClick={ this.onLogsClick }>
						Logs
					</div>
					<div
						className='action-button pod-button-delete'
						onClick={ this.onDeleteClick }>
						Restart
					</div>
				</div>
				<div className='pod-body'>
					{ restartsSection }
					{ metricsSection }
					<PodContainers pod={ pod } />
				</div>
				{ logs }
			</div>
		)
	}
}

export default Pod
