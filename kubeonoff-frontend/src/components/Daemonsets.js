import React from 'react'
import './Daemonsets.css'

import Daemonset from './Daemonset'

const Daemonsets = ( {
		daemonsets,
		pods,
		onClick
	} ) => {

	const podsByDaemonset = {}

	pods.forEach( pod => {
		(pod.metadata.ownerReferences || []).forEach( owner => {
			if ( owner.kind !== 'DaemonSet' )
				return

			const daemonsetUid = owner.uid

			if ( !podsByDaemonset[ daemonsetUid ] )
				podsByDaemonset[ daemonsetUid ] = []

			podsByDaemonset[ daemonsetUid ].push( pod )
		} )
	} )

	const daemonsetItems = daemonsets
		.map( d => (
			<Daemonset
				key={ d.metadata.uid }
				daemonset={ d }
				pods={ podsByDaemonset[ d.metadata.uid ] }
				onClick={ onClick } />
		) )

	if ( !daemonsetItems.length )
		return null

	return (
		<div className='daemonsets'>
			<h2 className='daemonsets-header'>Daemonsets</h2>
			<div className='daemonsets-list'>
				{ daemonsetItems }
			</div>
		</div>
	)
}

export default Daemonsets
