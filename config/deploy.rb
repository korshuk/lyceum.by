# config valid only for Capistrano 3.1
lock '3.1.0'

set :application, 'lyceum.by'
set :repo_url, 'git@github.com:korshuk/lyceum.by.git'
set :branch, 'master'
set :user, 'lyceum'
# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }

set :deploy_to, '/var/www/lyceum'
set :scm, :git

set :format, :pretty

set :log_level, :debug

set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

set :keep_releases, 5

namespace :deploy do
#TODO: Add stop task in upstart
  desc "Stop Forever"
  task :started do
    on roles(:app) do
      begin
        execute "forever stopall"
      rescue
        info "no forever script"
      end 
    end
  end
 
  desc "Install node modules non-globally"
  task :npm_install do
    on roles(:app) do
      execute "cd #{current_path} && npm install"
    end
  end
 
  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
	info "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
      # This assumes you are using upstart to startup your application 
      # - be sure that your upstart script runs as the 'deploy' user
      #execute "sudo start node-upstart-script", raise_on_non_zero_exit: false
	execute "cd #{current_path} && sudo forever start app.js"
    end
  end
  
  after :started, 'deploy:npm_install'
  after :npm_install, 'deploy:restart'

end
