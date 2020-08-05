import React from 'react'
import './Deployments.css'

import Deployment from './Deployment'

const Deployments = ( {
		deployments,
		replicasetDeploymentMap,
		pods,
		onStopStartClick,
		onRestartClick
	} ) => {

	const podsByDeployment = {}

	pods.forEach( pod => {
		(pod.metadata.ownerReferences || []).forEach( owner => {
			if ( owner.kind !== 'ReplicaSet' )
				return
			const replicasetUid = owner.uid
			const deploymentUid = replicasetDeploymentMap[ replicasetUid ]
			if ( !podsByDeployment[ deploymentUid ] )
				podsByDeployment[ deploymentUid ] = []

			podsByDeployment[ deploymentUid ].push( pod )
		} )
	} )

	const deploymentItems = deployments
		.map( d => (
			<Deployment
				key={ d.metadata.uid }
				deployment={ d }
				pods={ podsByDeployment[ d.metadata.uid ] }
				onStopStartClick={ onStopStartClick }
				onRestartClick={ onRestartClick } />
		) )

	return (
		<div className='deployments'>
			<h2 className='deployments-header'>Deployments</h2>
			<div className='deployments-list'>
				{ deploymentItems }
			</div>
		</div>
	)
}

export default Deployments
