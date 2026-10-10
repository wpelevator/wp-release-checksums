import { setFailed, setOutput } from '@actions/core';
import { Logger, execute } from '@wpelevator/wp-release';
import { getChecksumsArgs } from './inputs.ts';

const logger = new Logger( { ci: true } );

try {
	const { result } = await execute( 'checksums', getChecksumsArgs(), {
		cwd: process.env.GITHUB_WORKSPACE || process.cwd(),
		logger,
	} );
	const { checksumsPath, files } = result;

	setOutput( 'checksums-path', checksumsPath );
	setOutput( 'files', files );
} catch ( error ) {
	setFailed( error instanceof Error ? error.message : String( error ) );
}
