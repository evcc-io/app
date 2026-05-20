import {
  SpinnerProps,
  Spinner as UIKittenSpinner,
} from "@ui-kitten/components";
import { testingEnvironment } from "helper/launchArguments";

export default function Spinner(props: SpinnerProps) {
  return <UIKittenSpinner {...props} animating={!testingEnvironment()} />;
}
