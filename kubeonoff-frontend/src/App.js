import React, { Component } from 'react'
import Fuse from 'fuse.js'
import './App.css'

import { getAll, on, off, restart, getExtensions } from './lib/api'

import Loading from './components/Loading'
import Scroller from './components/Scroller'
import Daemonsets from './components/Daemonsets'
import Deployments from './components/Deployments'
import Extensions from './components/Extensions'
import ModeSpecificContent from './components/ModeSpecificContent'


class App extends Component {

	deploymentsFuse = null
	daemonsetsFuse = null

	updateInterval = null

	state = {
		data: null,
		extensions: null,
		search: '',
		error: null
	}

	componentDidMount() {
		this.fetchData()

		// TODO: Make this a timeout because we're gonna get weird behaviour if a request is longer than 5s
		this.updateInterval = setInterval( () => this.fetchData(), 5000 )
	}

	componentWillUnmount() {
		clearInterval( this.updateInterval )
	}

	async fetchData() {
		try {
			const data = await getAll()

			const fuseOptions = {
				shouldSort: true,
				threshold: 0.4,
				keys: [
					'metadata.name'
				]
			}

			this.deploymentsFuse = new Fuse( data.deployments.items, fuseOptions )
			this.daemonsetsFuse = new Fuse( data.daemonsets.items, fuseOptions )

			if (data.metrics) {
				// attach metrics to pods
				data.pods.items.forEach( pod => {
					const metrics = data.metrics[pod.metadata.name];
					if (metrics) {
						pod.metrics = metrics;
					}
				} )
			}

			this.setState( {
				data
			} )
		} catch (err) {
			this.setState( {
				data: null,
				error: err
			} )
		}

		try {
			const extensions = await getExtensions()

			this.setState( {
				extensions: extensions || []
			} )
		} catch (err) {
			this.setState( {
				extensions: null,
				error: err
			} )
		}
	}

	onSearch = e => {
		this.setState( {
			search: e.target.value
		} )
	}

	onStopStartClickDeployment = async deployment => {
		console.info( 'Clicked on/off on deployment', deployment )

		const isOff = !deployment.spec.replicas

		const func = isOff ? on : off

		try {
			const response = await func( deployment.metadata.name )
			console.log( 'Got response after click', response )
		} catch (err) {
			console.error( err )
			this.setState( {
				error: err
			} )
		}

		await this.fetchData()
	}

	onRestartClickDeployment = async deployment => {
		console.info( 'Clicked restart on deployment', deployment )

		try {
			const response = await restart( deployment.metadata.name )
			console.log( 'Got response after click', response )
		} catch (err) {
			console.error( err )
			this.setState( {
				error: err
			} )
		}

		await this.fetchData()
	}

	onClearError = e => {
		this.setState( {
			error: null
		} )
	}

	render() {

		const {
			data,
			error,
			extensions,
			search
		} = this.state

		const errorBar = error ? (
			<div
				className='error-bar'
				onClick={ this.onClearError }>
				{ error.toString() }
			</div>
			) : null

		if ( !data )
			return (
				<div className='kubeonoff kubeonoff-loading'>
					{ errorBar }
					<Loading/>
				</div>
		)

		const deployments = search ? this.deploymentsFuse.search( search ): data.deployments.items
		const daemonsets = search ? this.daemonsetsFuse.search( search ): data.daemonsets.items

		return (
			<div className='kubeonoff'>
				<header>
					<input
						type='text'
						autoFocus
						value={ search }
						onChange={ this.onSearch }
						placeholder='search resources' />
				</header>
				{ errorBar }
				<main>
					<Scroller>
						<ModeSpecificContent/>
						<Extensions extensions={ extensions } />
						<Daemonsets
							daemonsets={ daemonsets }
							pods={ data.pods.items } />
						<Deployments
							deployments={ deployments }
							replicasetDeploymentMap={ data.replicaset_deployment_map }
							pods={ data.pods.items }
							onRestartClick={ this.onRestartClickDeployment }
							onStopStartClick={ this.onStopStartClickDeployment } />
					</Scroller>
				</main>
				<footer>
					<nav></nav>
					<h1>Kubeonoff</h1>
				</footer>
			</div>
		)
	}
}

export default App
