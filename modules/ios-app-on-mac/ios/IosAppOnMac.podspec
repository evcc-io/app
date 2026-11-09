Pod::Spec.new do |s|
  s.name           = 'IosAppOnMac'
  s.version        = '1.0.0'
  s.summary        = 'Detects an iPad app running on macOS'
  s.author         = 'evcc'
  s.homepage       = 'https://github.com/evcc-io/app'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
