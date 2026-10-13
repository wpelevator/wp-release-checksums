import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as runCli } from '@wpelevator/wp-release';
import { withEnv } from './test-env.ts';

/**
 * Create a plugin, a trusted codec config and an action runner.
 *
 * @param t Test context for cleaning up temporary files.
 * @return Fixture paths and action runner.
 */
function fixture( t: TestContext ) {
	const cwd = mkdtempSync( join( tmpdir(), 'wp-release-checksums-action-' ) );
	const source = join( cwd, 'source' );
	const output = join( cwd, 'outputs' );
	t.after( () => rmSync( cwd, { recursive: true, force: true } ) );
	mkdirSync( source );
	writeFileSync(
		join( source, 'example.php' ),
		'<?php\n/*\nPlugin Name: Example\nVersion: 1.2.0\n*/\n'
	);
	writeFileSync( output, '' );
	writeFileSync(
		join( cwd, 'release.mjs' ),
		"export default { packages: [], integrity: { codec: 'sha256sum', file: 'ignored.json', embed: true, sign: { formats: ['wordpress'] } } };"
	);
	const run = ( inputs: Record< string, string > ) =>
		withEnv(
			{
				GITHUB_WORKSPACE: cwd,
				GITHUB_OUTPUT: output,
				WP_RELEASE_SIGNING_KEY: '',
				'INPUT_SOURCE-DIR': source,
				INPUT_SLUG: 'example',
				INPUT_CONFIG: 'release.mjs',
				...inputs,
			},
			() =>
				spawnSync(
					process.execPath,
					[ fileURLToPath( new URL( './run.ts', import.meta.url ) ) ],
					{ cwd, env: process.env, encoding: 'utf8' }
				)
		);
	return { cwd, source, output, run };
}

test( 'uses the configured GNU codec without enabling packaging or signing', async ( t ) => {
	const { cwd, source, output, run } = fixture( t );
	const result = run( {} );
	const manifest = join( cwd, 'SHA256SUMS' );
	assert.equal( result.status, 0, result.stdout + result.stderr );
	assert.match(
		readFileSync( manifest, 'utf8' ),
		/^[a-f0-9]{64}  example.php\n$/,
		'The configured codec should determine both the manifest bytes and default filename.'
	);
	assert.ok(
		readFileSync( output, 'utf8' ).includes( manifest ),
		'The manifest output should expose its absolute path.'
	);
	assert.equal(
		existsSync( join( source, 'ignored.json' ) ),
		false,
		'Standalone checksums should not apply configured embedding or manifest filenames.'
	);
	assert.equal(
		await runCli(
			[
				'verify',
				source,
				'--checksums',
				manifest,
				'--checksums-format',
				'sha256sum',
			],
			{ cwd }
		),
		0,
		'The standalone GNU manifest should verify the plugin files.'
	);
} );

test( 'explicit JSON format overrides the configured codec', ( t ) => {
	const { cwd, run } = fixture( t );
	const result = run( { 'INPUT_CHECKSUMS-FORMAT': 'wordpress-json' } );
	assert.equal( result.status, 0, result.stdout + result.stderr );
	const manifest = JSON.parse(
		readFileSync( join( cwd, 'example.1.2.0.checksums.json' ), 'utf8' )
	);
	assert.equal(
		manifest.plugin,
		'example',
		'The JSON manifest should preserve plugin identity.'
	);
	assert.equal(
		manifest.version,
		'1.2.0',
		'The JSON manifest should preserve the detected version.'
	);
	assert.deepEqual(
		Object.keys( manifest.files ),
		[ 'example.php' ],
		'Only source files should be hashed.'
	);
	assert.equal(
		existsSync( join( cwd, 'SHA256SUMS' ) ),
		false,
		'An explicit JSON codec should replace the configured GNU codec.'
	);
} );

test( 'rejects an unknown format before writing a manifest', ( t ) => {
	const { cwd, run } = fixture( t );
	const result = run( {
		'INPUT_CHECKSUMS-FORMAT': 'unknown',
		INPUT_OUTPUT: 'manifest.txt',
	} );
	assert.equal(
		result.status,
		1,
		'An unknown checksum format should fail the action.'
	);
	assert.equal(
		existsSync( join( cwd, 'manifest.txt' ) ),
		false,
		'Codec validation should run before manifest writes.'
	);
} );
