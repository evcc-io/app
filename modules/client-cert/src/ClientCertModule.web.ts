import { registerWebModule, NativeModule } from 'expo';

class ClientCertModule extends NativeModule<Record<string, never>> {}

export default registerWebModule(ClientCertModule, 'ClientCertModule');
