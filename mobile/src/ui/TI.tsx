// Translating TextInput (2026-07-17, engine v4). Placeholders are props,
// not children, so the ui/T Text wrapper never sees them -- the 13
// placeholders across seven screens were the visible "some text does not
// convert" gaps. Same pattern as ui/T: translate the placeholder through
// the shared engine and re-render on every language tick.
import React from 'react'
import { TextInput as RNTextInput, TextInputProps } from 'react-native'
import { T as tr, onI18n } from '../i18n'

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function TextInput(props, ref) {
    const [, tick] = React.useState(0)
    React.useEffect(() => onI18n(() => tick((t) => t + 1)), [])
    const { placeholder, ...rest } = props
    return (
      <RNTextInput
        ref={ref}
        {...rest}
        placeholder={typeof placeholder === 'string' ? tr(placeholder) : placeholder}
      />
    )
  }
)
