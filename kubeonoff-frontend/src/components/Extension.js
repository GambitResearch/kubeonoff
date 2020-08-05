import React from 'react'
import './Extension.css'

import { getExtensionControls, extensionRequest } from '../lib/api'

import { ControlItem } from './ExtensionControls'

class Extension extends React.Component {

	state = {
		controls: null,
		values: {},
		errors: {}
	}

	componentDidMount() {
		this.fetchData()
	}

	async fetchData() {
		const controls = await getExtensionControls( this.props.extension.name )

		this.setState( {
			controls
		} )
	}

	async updateControl( control, value ) {

		console.log( control, value )

		try {
			const response = await extensionRequest.POST( this.props.extension.name, control.endpoint, {
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify( value )
			} )
			console.log( response )
			this.setState( {
				errors: {
					...this.state.errors,
					[control.key]: null
				}
			} )

			await this.fetchData()
			this.setState( {
				values: {
					...this.state.values,
					[control.key]: undefined
				}
			} )
		} catch (err) {
			this.setState( {
				errors: {
					...this.state.errors,
					[control.key]: err
				}
			} )
		}

	}

	onChange = ( control, value ) => {
		console.log( `Set ${control.key} to ${JSON.stringify(value)}` )
		this.setState( {
			values: {
				...this.state.values,
				[control.key]: value
			}
		}, () => this.updateControl( control, value ) )
	}

	render() {

		const {
			extension
		} = this.props

		const {
			controls,
			values,
			errors
		} = this.state

		const controlItems = controls ? controls.controls.map( control => (
			<ControlItem
				key={ control.key }
				item={ control }
				value={ values[ control.key ] }
				error={ errors[ control.key ] }
				onChange={ value => this.onChange( control, value ) } />
		) ): null

		return (
			<div className='extension'>
				<h2 className='extension-name'>{ extension.name }</h2>
				<div className='extension-body'>
					{ controlItems }
				</div>
			</div>
		)
	}

}

export default Extension
