import { registerWebModule, NativeModule } from 'expo';

class TestModule extends NativeModule<{}> {}

export default registerWebModule(TestModule, 'TestModule');
