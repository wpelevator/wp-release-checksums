import { setOutput } from '@actions/core';
import {
	GitHubActionsWriter,
	Logger,
	execute,
	logError,
} from '@wpelevator/wp-release';
import { getChecksumsArgs } from './inputs.ts';

const logger = new Logger( { writer: new GitHubActionsWriter() } );

try {
	const { result } = await execute( 'checksums', getChecksumsArgs(), {
		cwd: process.env.GITHUB_WORKSPACE || process.cwd(),
		logger,
	} );
	const { checksumsPath, files } = result;

	setOutput( 'checksums-path', checksumsPath );
	setOutput( 'files', files );
} catch ( error ) {
	logError( logger, error, 'WP Release Checksums' );
	process.exitCode = 1;
}
