import React from 'react'
import './Daemonset.css'

import { deletePod } from '../lib/api'
import { computeDaemonsetState, computeMaxMetrics } from '../lib/utils'

import Pod from './Pod'
import MetricGauge from './MetricGauge'


class DaemonsetBody extends React.Component {

	static defaultProps = {
		pods: []
	}

	onPodDelete = async pod => {
		const result = await deletePod( pod.metadata.name )
		console.log( result )
	}

	render() {

		const {
			pods
		} = this.props

		const podItems = pods.map( pod => (
			<Pod
				key={ pod.metadata.uid }
				pod={ pod }
				onDeleteClick={ this.onPodDelete } />
		) )

		return (
			<div className='daemonset-body'>
				<div className='daemonset-body-pods'>
					<h3>Pods</h3>
					{ podItems }
				</div>
			</div>
		)
	}
}


class Daemonset extends React.PureComponent {

	state = {
		expanded: false
	}

	toggleExpanded = () => {
		this.setState( {
			expanded: !this.state.expanded
		} )
	}

	handleActionClick = e => {
		e.preventDefault()
		e.stopPropagation()
		this.props.onClick( this.props.daemonset )
	}

	render() {
		const {
			expanded
		} = this.state

		const {
			daemonset,
			pods
		} = this.props

		const {
			metadata,
			status
		} = daemonset

		const state = computeDaemonsetState( daemonset )

		const {
			desiredNumberScheduled = 0,
			numberAvailable = 0
		} = status

		const daemonsetBody = expanded ? (
			<DaemonsetBody
				daemonset={ daemonset }
				pods={ pods } />
			) : null
		const maxMetrics = computeMaxMetrics(pods)

		return (
			<div
				className={ `daemonset daemonset-state-${state} ${expanded ? 'expanded' : ''}` }
				data-daemonset-name={ metadata.name }>
				<div
					className='daemonset-header'
					onClick={ this.toggleExpanded }>
					<div className={ `state-indicator state-indicator-${state}` }>
						{ desiredNumberScheduled === numberAvailable? desiredNumberScheduled : `${numberAvailable}/${desiredNumberScheduled}` }
					</div>
					<div className='daemonset-name'>
						{ metadata.name }
					</div>
					<MetricGauge metric={maxMetrics.cpu} label="cpu" />
					<MetricGauge metric={maxMetrics.mem} label="mem" />
				</div>
				{ daemonsetBody }
			</div>
		)

	}
}

export default Daemonset
