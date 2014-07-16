#!/usr/bin/env python

from fabric.api import *

import app_config

"""
Deployment

Changes to deployment requires a full-stack test. Deployment
has two primary functions: Pushing flat files to S3 and deploying
code to a remote server if required.
"""
def _deploy_to_file_server(path='www'):
    local('rm -rf %s/live-data' % path)
    local('rm -rf %s/sitemap.xml' % path)

    local('rsync -vr %s/ ubuntu@%s:~/www/%s' % (path, app_config.FILE_SERVER, app_config.PROJECT_SLUG))

def assets_down(path='www/assets'):
    """
    Download assets folder from s3 to www/assets
    """
    local('aws s3 sync s3://%s/%s/ %s/ --acl "public-read" --cache-control "max-age=5" --region "us-east-1"' % (app_config.ASSETS_S3_BUCKET, app_config.PROJECT_SLUG, path))

def assets_up(path='www/assets'):
    """
    Upload www/assets folder to s3
    """
    _confirm("You are about to replace the copy of the folder on the server with your own copy. Are you sure?")

    local('aws s3 sync %s/ s3://%s/%s/ --acl "public-read" --cache-control "max-age=5" --region "us-east-1" --delete' % (
            path,
            app_config.ASSETS_S3_BUCKET,
            app_config.PROJECT_SLUG
        ))

def assets_rm(path):
    """
    remove an asset from s3 and locally
    """
    file_list = glob(path)

    if len(file_list) > 0:

        _confirm("You are about to destroy %s files. Are you sure?" % len(file_list))

        with settings(warn_only=True):

            for file_path in file_list:

                local('aws s3 rm s3://%s/%s/%s --region "us-east-1"' % (
                    app_config.ASSETS_S3_BUCKET,
                    app_config.PROJECT_SLUG,
                    file_path.replace('www/assets/', '')
                ))

                local('rm -rf %s' % path)

def _gzip(in_path='www', out_path='.gzip'):
    """
    Gzips everything in www and puts it all in gzip
    """
    local('python gzip_www.py %s %s' % (in_path, out_path))

def deploy(remote='origin'):
    """
    Deploy the latest app to S3 and, if configured, to our servers.
    """
    _deploy_to_file_server('www')

"""
Destruction

Changes to destruction require setup/deploy to a test host in order to test.
Destruction should remove all files related to the project from both a remote
host and S3.
"""
def _confirm(message):
    answer = prompt(message, default="Not at all")

    if answer.lower() not in ('y', 'yes', 'buzz off', 'screw you'):
        exit()

def shiva_the_destroyer():
    """
    Deletes the app from s3
    """
    _confirm("You are about to destroy everything deployed to %s for this project.\nDo you know what you're doing?" % app_config.DEPLOYMENT_TARGET)

    # Not updated for fileserver
