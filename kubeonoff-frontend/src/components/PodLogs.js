import React from 'react'
import './PodLogs.css'

import { getPodLog } from '../lib/api'

import ScrollToBottom from './ScrollToBottom'


class ContainerLogs extends React.Component {

	state = {
		loading: true,
		error: null,
		timestamps: false,
		logs: null
	}

	componentDidMount() {
		this.fetchData()
	}

	fetchData = async () => {

		const {
			timestamps
		} = this.state

		this.setState( {
			loading: true,
			error: null
		} )

		try {
			const logs = await getPodLog( this.props.pod.metadata.name, this.props.container.name, timestamps )
			this.setState( {
				loading: false,
				error: null,
				logs
			} )
		} catch (err) {
			this.setState( {
				loading: false,
				error: err,
				logs: null
			} )
		}

	}

	toggleTimestamps = () => {
		const timestamps = !this.state.timestamps

		this.setState( {
			timestamps
		}, this.fetchData )
	}

	popout = () => window.open( `${window.location.href}v1/pods/${this.props.pod.metadata.name}/${this.props.container.name}/log${this.state.timestamps ? '?timestamps=true' : ''}`, '_blank' )

	render() {

		const {
			loading,
			error,
			logs,
			timestamps
		} = this.state

		const {
			container
		} = this.props

		if ( error ) {
			return (
				<div className='container-logs-error'>
					{ error.toString() }
				</div>
			)
		}

		return (
			<div className='container-logs'>
				<div className='container-logs-header'>
					<div className='container-logs-name'>
						{ container.name }
					</div>
					<div className='container-logs-buttons'>
						<div
							className='container-logs-timestamps'
							onClick={ this.toggleTimestamps }>
							{ timestamps ? 'hide timestamps' : 'show timestamps' }
						</div>
						<div
							className='container-logs-reload'
							onClick={ this.fetchData }>
							reload
						</div>
						<div
							className='container-logs-popout'
							onClick={ this.popout }>
							view raw
						</div>
					</div>
				</div>
				<ScrollToBottom className='scroller'>
					<pre>{ loading ? 'Loading...' : (logs || 'No logs to display') }</pre>
				</ScrollToBottom>
			</div>
		)
	}

}


const PodLogs = ( {
		pod
	} ) => {

	const containerLogItems = pod.spec.containers.map( container => (
		<ContainerLogs
			key={ container.name }
			pod={ pod }
			container={ container } />
	) )

	return (
		<div className='pod-logs'>
			{ containerLogItems }
		</div>
	)
}

export default PodLogs
