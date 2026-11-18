Pod::Spec.new do |s|
  s.name           = 'WatchSync'
  s.version        = '1.0.0'
  s.summary        = 'Syncs the server list to the evcc Apple Watch app'
  s.author         = 'evcc'
  s.homepage       = 'https://github.com/evcc-io/app'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity'
  s.source_files = '**/*.swift'
end
