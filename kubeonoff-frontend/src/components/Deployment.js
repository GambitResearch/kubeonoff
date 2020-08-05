import React from 'react'
import Markdown from 'react-markdown'
import './Deployment.css'

import { computeDeploymentState, isImportantDeployment,
	computeMinumumUptime, formatTimeAgo, computeMaxMetrics} from '../lib/utils'

import Pod from './Pod'
import MetricGauge from './MetricGauge'


class DeploymentDescription extends React.PureComponent {

	state = {
		expanded: false,
		theresMore: false
	}

	toggleExpanded = (e) => this.setState({ expanded: !this.state.expanded })

	// Don't try this at home, kids.
	componentDidMount() {
		if (!this.description)
			return

		const childCount = this.description.querySelector('.deployment-description-markdown').childElementCount
		this.setState({ theresMore: childCount > 1 })
	}

	render() {
		const { deployment } = this.props
		const { expanded, theresMore } = this.state

		let description = null
		const moreButton = <button className="more-less" onClick={this.toggleExpanded}>Show { expanded ? 'less' : 'more' }</button>

		try {
			description = deployment.metadata.annotations[ 'kubeonoff/description' ]
		} catch (err) {
			// noice
		}

		if ( !description )
				return null

		return (
			<div ref={r => this.description = r} className='deployment-description'>
				<Markdown
					className={`deployment-description-markdown ${expanded ? 'expanded' : 'summary'}`}
					source={ description } />
				{ theresMore ? moreButton : null }
			</div>
		)
	}
}


class DeploymentBody extends React.Component {

	static defaultProps = {
		pods: []
	}

	render() {

		const {
			deployment,
			pods
		} = this.props

		const podItems = pods.map( pod => (
			<Pod
				key={ pod.metadata.uid }
				pod={ pod } />
		) )

		return (
			<div className='deployment-body'>
				<DeploymentDescription deployment={ deployment } />
				<div
					className='deployment-body-pods'
					style={ { display: podItems.length ? '' : 'none' } }>
					<h3>Pods</h3>
					{ podItems }
				</div>
			</div>
		)
	}
}


const computeUptimeStyle = milliseconds => {
	const seconds = milliseconds / 1000
	const minutes = seconds / 60

	if ( seconds < 60 )
		return 'uptime-danger'
	else if ( minutes < 5 )
		return 'uptime-warning'
	else
		return 'uptime-okay'
}


class Deployment extends React.PureComponent {

	static defaultProps = {
		pods: []
	}

	state = {
		expanded: false
	}

	toggleExpanded = () => {
		this.setState( {
			expanded: !this.state.expanded
		} )
	}

	handleStopStartClick = e => {
		const important = isImportantDeployment( this.props.deployment )
		const intent = !important ||
		window.confirm( `Are you sure you want to alter the deployment "${this.props.deployment.metadata.name}"?\nIt has been marked as important` )

		e.preventDefault()
		e.stopPropagation()

		if ( intent ) {
			this.props.onStopStartClick( this.props.deployment )
		}
	}

	handleRestartClick = e => {
		const important = isImportantDeployment( this.props.deployment )
		const intent = !important ||
		window.confirm( `Are you sure you want to alter the deployment "${this.props.deployment.metadata.name}"?\nIt has been marked as important` )

		e.preventDefault()
		e.stopPropagation()

		if ( intent ) {
			this.props.onRestartClick( this.props.deployment )
		}
	}

	render() {
		const {
			expanded
		} = this.state

		const {
			deployment,
			pods
		} = this.props

		const {
			metadata,
			spec,
			status
		} = deployment

		const off = !spec.replicas

		const state = computeDeploymentState( deployment )

		const shouldDisable = metadata.name.includes( 'kubeonoff' )

		const {
			replicas = 0,
			readyReplicas = 0,
			unavailableReplicas = 0
		} = status

		const important = isImportantDeployment( deployment )
		const maxMetrics = computeMaxMetrics(pods)

		const deploymentBody = expanded ? (
			<DeploymentBody
				deployment={ deployment }
				pods={ pods } />
			) : null

		const podUptimes = pods.map( pod => computeMinumumUptime( pod ) )

		const uptime = podUptimes.length ? Math.min( ...podUptimes ): null

		const stopStartButton = expanded ? (
			<div
				className='action-button'
				onClick={ this.handleStopStartClick }
				style={ { display: shouldDisable?'none':'' } }>
				{ off? 'Start' : 'Stop' }
			</div>
			) : null


		return (
			<div
				className={ `deployment deployment-state-${state} ${expanded ? 'expanded' : ''} ${important ? 'important' : ''}` }
				data-deployment-name={ metadata.name }>
				<div
					className='deployment-header'
					onClick={ this.toggleExpanded }>
					<div className={ `state-indicator state-indicator-${state}` }>
						{ replicas === spec.replicas? replicas : `${readyReplicas + unavailableReplicas}/${spec.replicas}` }
					</div>
					<div className='deployment-name'>
						{ metadata.name }
					</div>
					<MetricGauge metric={maxMetrics.cpu} label="cpu" />
					<MetricGauge metric={maxMetrics.mem} label="mem" />
					<div
						className={ `deployment-uptime ${uptime ? computeUptimeStyle(uptime) : ''}` }
						style={ { display: uptime ? '' : 'none' } }>
						{ uptime ? formatTimeAgo( uptime ): null }
					</div>
					<div
						className='action-button restart'
						onClick={ this.handleRestartClick }
						style={ { display: shouldDisable || off ?'none':'' } }>
						{ 'Restart' }
					</div>
					{ stopStartButton }
				</div>
				{ deploymentBody }
			</div>
		)

	}
}

export default Deployment
