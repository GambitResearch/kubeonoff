import React from 'react'
import './ExtensionControls.css'


export const ControlMeta = ( {
		title,
		description,
		error
	} ) => (
	<div className='control-meta'>
		<div
			className='control-meta-error'
			style={ { display: error ? '' : 'none' } }>
			{ error ? error.toString(): null }
		</div>
		<div className='control-meta-title'>
			{ title }
		</div>
		<div className='control-meta-description'>
			{ description }
		</div>
	</div>
)


export const SelectControlItem = ( {
		value,
		error,
		onChange,
		item: {
			options,
			title,
			description
		}
	} ) => {
	const optionItems = options.map( ( [ val, label ] ) => (
		<option
			key={ val }
			value={ val }>
			{ label }
		</option>
	) )

	return (
		<div className='control-item control-select'>
			<ControlMeta
				error={ error }
				title={ title }
				description={ description } />
			<select
				onChange={ e => onChange( e.target.value ) }
				value={ value }>
				{ optionItems }
			</select>
		</div>
	)
}


export const TextControlItem = ( {
		value,
		error,
		onChange,
		item: {
			title,
			description,
			inputType='text'
		}
	} ) => (
	<div className='control-item control-text'>
		<ControlMeta
			error={ error }
			title={ title }
			description={ description } />
		<input
			type={ inputType }
			value={ value !== null? value : '' }
			onChange={ e => onChange( e.target.value ) } />
	</div>
)


export class ControlGroup extends React.Component {

	state = {
		values: {}
	}

	onSubmit = () => {

		const controlValues = {}

		this.props.item.controls.forEach( control => controlValues[ control.key ] = control.value )

		this.props.onChange( {
			...controlValues,
			...this.state.values
		} )
	}

	onChange = ( key, value ) => {
		console.log( `Set ${this.props.item.key}.${key} to ${JSON.stringify(value)}` )
		this.setState( {
			values: {
				...this.state.values,
				[key]: value
			}
		} )
	}

	render() {

		const {
			error,
			item
		} = this.props

		const {
			submit_label,
			controls
		} = item

		const {
			values
		} = this.state

		const controlItems = controls.map( control => (
			<ControlItem
				key={ control.key }
				item={ control }
				value={ values[ control.key ] }
				onChange={ value => this.onChange( control.key, value ) } />
		) )

		return (
			<div className='control-group'>
				<ControlMeta error={ error } />
				<div className='control-group-items'>
					{ controlItems }
				</div>
				<button onClick={ this.onSubmit }>
					{ submit_label }
				</button>
			</div>
		)
	}
}


export const ControlItem = ( {
		item,
		value,
		error,
		onChange
	} ) => {
	if ( !EXTENSION_CONTROLS_TYPE_MAP[ item.type ] )
		return null

	return React.createElement( EXTENSION_CONTROLS_TYPE_MAP[ item.type ], {
		item,
		onChange,
		error,
		value: typeof value !== 'undefined'? value : item.value
	} )
}


export const EXTENSION_CONTROLS_TYPE_MAP = {
	controlgroup: ControlGroup,
	select: SelectControlItem,
	text: TextControlItem
}
