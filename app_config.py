#!/usr/bin/env python

"""
Project-wide application configuration.

DO NOT STORE SECRETS, PASSWORDS, ETC. IN THIS FILE.
They will be exposed to users. Use environment variables instead.
"""

import os

"""
NAMES
"""
# Project name used for display
PROJECT_NAME = 'chartbuilder'

# Project name in urls
# Use dashes, not underscores!
PROJECT_SLUG = 'charts'

# The name of the repository containing the source
REPOSITORY_NAME = 'Chartbuilder'
REPOSITORY_URL = 'git@github.com:nprapps/%s.git' % REPOSITORY_NAME
REPOSITORY_ALT_URL = None # 'git@bitbucket.org:nprapps/%s.git' % REPOSITORY_NAME'

# The name to be used in paths on the server
PROJECT_FILENAME = 'chartbuilder'

"""
DEPLOYMENT
"""
PRODUCTION_S3_BUCKETS = ['tools.apps.npr.org']
STAGING_S3_BUCKETS = ['stage-tools.apps.npr.org']

PRODUCTION_SERVERS = ['cron.nprapps.org']
STAGING_SERVERS = ['50.112.92.131']

# These variables will be set at runtime. See configure_targets() below
S3_BUCKETS = []
S3_BASE_URL = ''
DEBUG = True

def configure_targets(deployment_target):
    """
    Configure deployment targets. Abstracted so this can be
    overriden for rendering before deployment.
    """
    global S3_BUCKETS
    global S3_BASE_URL
    global DEBUG
    global DEPLOYMENT_TARGET

    if deployment_target == 'production':
        S3_BUCKETS = PRODUCTION_S3_BUCKETS
        S3_BASE_URL = 'http://%s/%s' % (S3_BUCKETS[0], PROJECT_SLUG)
        DEBUG = False
    elif deployment_target == 'staging':
        S3_BUCKETS = STAGING_S3_BUCKETS
        S3_BASE_URL = 'http://%s/%s' % (S3_BUCKETS[0], PROJECT_SLUG)
        DEBUG = True
    else:
        S3_BUCKETS = [] 
        S3_BASE_URL = 'http://127.0.0.1:8000'
        DEBUG = True

    DEPLOYMENT_TARGET = deployment_target

"""
Run automated configuration
"""
DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

configure_targets(DEPLOYMENT_TARGET)

