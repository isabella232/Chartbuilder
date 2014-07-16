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
FILE_SERVER = 'tools.apps.npr.org'

# These variables will be set at runtime. See configure_targets() below
DEBUG = True

def configure_targets(deployment_target):
    """
    Configure deployment targets. Abstracted so this can be
    overriden for rendering before deployment.
    """
    global DEBUG
    global DEPLOYMENT_TARGET

    if deployment_target == 'production':
        DEBUG = False
    elif deployment_target == 'staging':
        DEBUG = True
    else:
        DEBUG = True

    DEPLOYMENT_TARGET = deployment_target

"""
Run automated configuration
"""
DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

configure_targets(DEPLOYMENT_TARGET)

